# ============================================================================
# File: routers/ai_chat.py
# Description: AI Financial Assistant endpoint with context builder, Gemini API integration,
#              and in-memory rate limiting (max 5 prompts/min per user).
# ============================================================================
import os
import json
import time
import ssl
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

def generate_smart_db_insight(prompt: str, fin_context: str) -> str:
    prompt_lower = prompt.lower()
    
    if "spend" in prompt_lower or "expense" in prompt_lower or "category" in prompt_lower or "most money" in prompt_lower:
        categories = fin_context.split("Top Expense Categories: ")[1].split("\n")[0] if "Top Expense Categories: " in fin_context else "No logged expenses"
        return f"Based on your live transaction records, your top spending breakdown is:\n\n• **{categories}**\n\n*Tip: Keep track of these categories in your Budgets tab to control discretionary spending.*"
    
    if "stock" in prompt_lower or "portfolio" in prompt_lower or "holding" in prompt_lower:
        holdings = fin_context.split("Stock Holdings: ")[1].split("\n")[0] if "Stock Holdings: " in fin_context else "No holdings"
        val = fin_context.split("Stock Portfolio Value: CAD $")[1].split("\n")[0] if "Stock Portfolio Value: CAD $" in fin_context else "0.00"
        return f"Your stock portfolio is currently valued at **CAD ${val}**.\n\n• **Active Holdings**: {holdings}"
    
    if "net worth" in prompt_lower or "overall health" in prompt_lower or "summarize" in prompt_lower:
        nw = fin_context.split("Total Net Worth: CAD $")[1].split("\n")[0] if "Total Net Worth: CAD $" in fin_context else "0.00"
        cash = fin_context.split("Cash Balance: CAD $")[1].split("\n")[0] if "Cash Balance: CAD $" in fin_context else "0.00"
        liab = fin_context.split("Liabilities/Debts: CAD $")[1].split("\n")[0] if "Liabilities/Debts: CAD $" in fin_context else "0.00"
        return f"Here is your real-time financial breakdown:\n\n• **Total Net Worth**: CAD ${nw}\n• **Cash & Savings**: CAD ${cash}\n• **Liabilities/Debts**: CAD ${liab}"
    
    if "tip" in prompt_lower or "increase" in prompt_lower or "savings rate" in prompt_lower or "save" in prompt_lower:
        sr = fin_context.split("Savings Rate: ")[1].split("%")[0] if "Savings Rate: " in fin_context else "0.0"
        return f"Your current savings rate is **{sr}%**. Here are 3 actionable tips to increase it:\n\n1. **Audit Monthly Subscriptions**: Cancel recurring expenses you no longer use.\n2. **Automate Payday Savings**: Direct 15-20% of your income into savings immediately.\n3. **Enforce Category Budgets**: Set alerts in your Budgets tab when approaching monthly spending caps."
    
    nw = fin_context.split("Total Net Worth: CAD $")[1].split("\n")[0] if "Total Net Worth: CAD $" in fin_context else "0.00"
    return f"Here is your financial snapshot:\n\n• **Net Worth**: CAD ${nw}\n\nAsk anything about your expenses, budgets, or investments!"

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
    
    now = time.time()
    history = [t for t in USER_CHAT_TIMESTAMPS.get(current_user.id, []) if now - t < RATE_LIMIT_WINDOW_SECONDS]
    remaining = max(0, MAX_REQUESTS_PER_WINDOW - len(history))

    user_prompt = payload.prompt.strip()
    if not user_prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    # 2. Build User Financial Context
    fin_context = build_user_financial_context(db, current_user)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    # Check if key is empty
    if not api_key:
        fallback_reply = generate_smart_db_insight(user_prompt, fin_context)
        return {"response": fallback_reply, "rate_limit_remaining": remaining}

    # 3. Try Google Gemini API Production Models
    models_to_try = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro",
        "gemini-2.0-flash-exp",
        "gemini-flash",
        "gemini-pro"
    ]

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

    last_error_details = []

    for model_name in models_to_try:
        # Standard API Key targets (removes Bearer header to prevent 401 OAuth errors)
        api_targets = [
            (f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}", {"Content-Type": "application/json"}),
            (f"https://generativelanguage.googleapis.com/v1/models/{model_name}:generateContent?key={api_key}", {"Content-Type": "application/json"}),
            (f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent", {"Content-Type": "application/json", "x-goog-api-key": api_key}),
            (f"https://generativelanguage.googleapis.com/v1/models/{model_name}:generateContent", {"Content-Type": "application/json", "x-goog-api-key": api_key})
        ]

        for gemini_url, headers in api_targets:
            try:
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE

                req = urllib.request.Request(
                    gemini_url,
                    data=json.dumps(req_payload).encode("utf-8"),
                    headers=headers
                )
                with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            ai_reply = parts[0].get("text", "")
                            if ai_reply:
                                return {"response": ai_reply, "rate_limit_remaining": remaining}
            except urllib.error.HTTPError as e:
                err_b = e.read().decode("utf-8", errors="ignore")
                err_msg = f"HTTP {e.code}: {err_b[:120]}"
                print(f"Gemini API model {model_name} HTTP Error: {err_msg}")
                last_error_details.append(err_msg)
                if e.code == 429:
                    raise HTTPException(status_code=429, detail="Google Gemini API rate limit reached. Please wait a moment.")
                continue
            except Exception as err:
                print(f"Gemini API model {model_name} Error:", err)
                last_error_details.append(str(err))
                continue

    # Fallback: Check if user asked a general non-financial question
    prompt_lower = user_prompt.lower()
    financial_keywords = ["spend", "expense", "budget", "saving", "stock", "portfolio", "worth", "health", "income", "money", "holding", "category"]
    is_financial_query = any(k in prompt_lower for k in financial_keywords)

    if not is_financial_query and last_error_details:
        err_hint = last_error_details[0] if last_error_details else "Connection Error"
        if "not supported for this API key" in err_hint or "not found" in err_hint:
            return {
                "response": "⚠️ **Google API Key Needs API Enablement**: Your key is valid, but the **Generative Language API** is not enabled on your Google Cloud Project yet.\n\n• **Option 1 (Easiest - 1 Click)**: Create a free key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) (auto-enabled).\n• **Option 2**: Enable API on your GCP project at [console.cloud.google.com](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com).",
                "rate_limit_remaining": remaining
            }
        return {
            "response": f"⚠️ **Google Gemini Connection Issue**: {err_hint}. Please check your key configuration in `week3_fastapi/.env`.",
            "rate_limit_remaining": remaining
        }

    fallback_reply = generate_smart_db_insight(user_prompt, fin_context)
    return {"response": fallback_reply, "rate_limit_remaining": remaining}
