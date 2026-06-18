# ============================================================================
# File: routers/categories.py
# Description: Defines category CRUD and budget setting routes using APIRouter.
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from schemas import CategoryCreate
import models

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

@router.get("")
def get_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    categories = db.query(models.Category).filter(models.Category.user_id == current_user.id).all()
    # Sort alphabetically, but keep "Uncategorized" at the very bottom
    return sorted(categories, key=lambda c: (c.name.lower() == "uncategorized", c.name.lower()))


@router.post("")
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if a category with this name already exists for the user
    existing_category = db.query(models.Category).filter(
        models.Category.user_id == current_user.id,
        models.Category.name == category.name
    ).first()
    
    if existing_category:
        raise HTTPException(
            status_code=400,
            detail=f"Category '{category.name}' already exists."
        )

    db_category = models.Category(
        name=category.name,
        icon=category.icon,
        monthly_budget=category.monthly_budget,
        user_id=current_user.id
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/{category_id}")
def update_category(
    category_id: int,
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_category = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.user_id == current_user.id
    ).first()

    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    db_category.name = category.name
    db_category.icon = category.icon
    db_category.monthly_budget = category.monthly_budget
    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    category = db.query(models.Category).filter(
        models.Category.user_id == current_user.id,
        models.Category.id == category_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    if category.name.lower() == "uncategorized":
        raise HTTPException(
            status_code=400,
            detail="The 'Uncategorized' category is required and cannot be deleted."
        )
        
    db.delete(category)
    db.commit()
    return {"message": f"Category {category_id} deleted"}
