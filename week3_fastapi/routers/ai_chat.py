# ============================================================================
# File: routers/ai_chat.py
# Description: AI Financial Assistant endpoint with context builder, Gemini API integration,
#              and in-memory rate limiting (max 5 prompts/min per user).
# ============================================================================
import os
import json
import time
import urllib.request
import urllib.error
from datetime import date, datetime, timedelta
from typing import Dict, List
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from database import get_db
from auth import get_current_user
import models
from common.stock_service import get_stock_price, _get_cad_price

router = APIRouter(
    prefix="/ai",
    tags=["AI Financial Assistant"]
)

# ----------------------------------------------------------------------------
# In-Memory Sliding Window Rate Limiter (Max 5 prompts / minute / user)
# ----------------------------------------------------------------------------
USER_CHAT_TIMESTAMPS: Dict[int, List[float]] = {}
RATE_LIMIT_WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 5

def check_rate_limit(user_id: int):
    now = time.time()
    user_history = USER_CHAT_TIMESTAMPS.get(user_id, [])
    
    # Filter timestamps within the last 60 seconds
    recent_history = [t for t in user_history if now - t < RATE_LIMIT_WINDOW_SECONDS]
    
    if len(recent_history) >= MAX_REQUESTS_PER_WINDOW:
        retry_after = int(RATE_LIMIT_WINDOW_SECONDS - (now - recent_history[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded (Max 5 AI prompts/min). Please wait {max(retry_after, 1)} seconds."
        )
    
    recent_history.append(now)
    USER_CHAT_TIMESTAMPS[user_id] = recent_history

# ----------------------------------------------------------------------------
# Schemas
# ----------------------------------------------------------------------------
class AiChatRequest(BaseModel):
    prompt: str

class AiChatResponse(BaseModel):
    response: str
    rate_limit_remaining: int

# ----------------------------------------------------------------------------
# Helper: Build Financial Context for User
# ----------------------------------------------------------------------------
def build_user_financial_context(db: Session, user: models.User) -> str:
    # 1. Transactions Totals
    income_res = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == user.id,
        models.Transaction.type == "income"
    ).scalar() or 0.0

    expense_res = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == user.id,
        models.Transaction.type == "expense"
    ).scalar() or 0.0

    cash_balance = float(income_res) - float(expense_res)
    net_savings = cash_balance
    savings_rate = (net_savings / float(income_res) * 100.0) if float(income_res) > 0 else 0.0

    # 2. Holdings & Stock Portfolio
    holdings = db.query(models.Holding).filter(models.Holding.user_id == user.id).all()
    holdings_summary = []
    total_stock_value = 0.0

    for h in holdings:
        price, _, _ = get_stock_price(h.ticker, db)
        p_cad = _get_cad_price(price, h.currency, db, ticker=h.ticker) if price else 0.0
        val = float(h.shares) * float(p_cad or price or 0.0)
        total_stock_value += val
        holdings_summary.append(f"{h.ticker}: {float(h.shares):.2f} shares @ CAD ${val:.2f}")

    # 3. Liabilities
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user.id).first()
    liabilities = float(profile.liabilities) if profile else 0.0
    net_worth = cash_balance + total_stock_value - liabilities

    # 4. Top Category Expenses
    category_expenses = db.query(
        models.Category.name,
        func.sum(models.Transaction.amount).label("total")
    ).join(
        models.Transaction, models.Transaction.category_id == models.Category.id
    ).filter(
        models.Transaction.user_id == user.id,
        models.Transaction.type == "expense"
    ).group_by(models.Category.name).order_by(func.sum(models.Transaction.amount).desc()).limit(5).all()

    top_categories_str = ", ".join([f"{cat_name}: ${float(tot):.2f}" for cat_name, tot in category_expenses]) or "None logged"

    # Context String for Gemini LLM
    context = f"""
USER FINANCIAL DATA CONTEXT:
- Total Net Worth: CAD ${net_worth:,.2f}
- Cash Balance: CAD ${cash_balance:,.2f}
- Stock Portfolio Value: CAD ${total_stock_value:,.2f}
- Liabilities/Debts: CAD ${liabilities:,.2f}
- All-Time Income: CAD ${float(income_res):,.2f}
- All-Time Expenses: CAD ${float(expense_res):,.2f}
- Net Savings: CAD ${net_savings:,.2f} (Savings Rate: {savings_rate:.1f}%)
- Top Expense Categories: {top_categories_str}
- Stock Holdings: {"; ".join(holdings_summary) if holdings_summary else "No stock holdings"}
"""
    return context

# ----------------------------------------------------------------------------
# Endpoint: POST /ai/chat
# ----------------------------------------------------------------------------
@router.post("/chat", response_model=AiChatResponse)
def chat_with_ai(
    payload: AiChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Rate Limit Guard (Max 5 requests per minute)
    check_rate_limit(current_user.id)
    
    # Calculate rate limit remaining
    now = time.time()
    history = [t for t in USER_CHAT_TIMESTAMPS.get(current_user.id, []) if now - t < RATE_LIMIT_WINDOW_SECONDS]
    remaining = max(0, MAX_REQUESTS_PER_WINDOW - len(history))

    user_prompt = payload.prompt.strip()
    if not user_prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    # 2. Build User Financial Context
    fin_context = build_user_financial_context(db, current_user)

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key or api_key.startswith("AQ.") == False and len(api_key) < 10:
        # Fallback smart insight if key missing
        fallback_text = (
            f"Based on your current numbers: Your total Net Worth is **CAD ${fin_context.split('Total Net Worth: CAD $')[1].split('\\n')[0]}**. "
            f"Your savings rate is **{fin_context.split('Savings Rate: ')[1].split('%')[0]}%**. "
            "To unlock full conversational AI analysis, ensure your Google Gemini API key is valid in `.env`."
        )
        return {"response": fallback_text, "rate_limit_remaining": remaining}

    # 3. Call Google Gemini 1.5 Flash API
    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    system_instruction = (
        "You are an expert, friendly AI Personal Financial Assistant for Veridian Finance. "
        "Use the provided user financial data context to answer the user's question concisely, accurately, and encouragingly. "
        "Use bullet points or bold formatting for readability. Keep your response under 150 words."
    )

    full_prompt = f"{system_instruction}\n\n{fin_context}\n\nUSER QUESTION: {user_prompt}"

    req_payload = {
        "contents": [{
            "parts": [{"text": full_prompt}]
        }]
    }

    try:
        req = urllib.request.Request(
            gemini_url,
            data=json.dumps(req_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            
            # Extract candidate text
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    ai_reply = parts[0].get("text", "I analyzed your financial data, but couldn't generate a response.")
                    return {"response": ai_reply, "rate_limit_remaining": remaining}
            
            return {"response": "Analyzed your financial context. How else can I assist with your budget or investments?", "rate_limit_remaining": remaining}

    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"Gemini API HTTP Error {e.code}: {err_body}")
        if e.code == 429:
            raise HTTPException(status_code=429, detail="Google Gemini API rate limit reached. Please wait a moment before asking again.")
        raise HTTPException(status_code=500, detail=f"Gemini API returned error code {e.code}.")
    except Exception as err:
        print("Error calling Gemini API:", err)
        raise HTTPException(status_code=500, detail="Failed to connect to Google Gemini AI service.")
