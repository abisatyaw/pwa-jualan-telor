from datetime import date, datetime

from sqlalchemy import Date, DateTime, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_name: Mapped[str] = mapped_column(String, nullable=False)
    asset_type: Mapped[str] = mapped_column(String, nullable=False)
    acquisition_price: Mapped[int] = mapped_column(nullable=False)
    acquisition_date: Mapped[date] = mapped_column(Date, nullable=False)
    depreciation_months: Mapped[int] = mapped_column(nullable=False, default=0)
    chicken_group: Mapped[str | None] = mapped_column(String, nullable=True)
    chicken_age_weeks_at_purchase: Mapped[int | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class Production(Base):
    __tablename__ = "productions"

    id: Mapped[int] = mapped_column(primary_key=True)
    production_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    chicken_group: Mapped[str] = mapped_column(String, nullable=False)
    quantity_kg: Mapped[float] = mapped_column(nullable=False)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True)
    sale_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    product_type: Mapped[str] = mapped_column(String, nullable=False)
    quantity: Mapped[float] = mapped_column(nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False)
    unit_price: Mapped[int] = mapped_column(nullable=False)
    total_price: Mapped[int] = mapped_column(nullable=False)
    buyer_name: Mapped[str] = mapped_column(String, nullable=False)
    payment_status: Mapped[str] = mapped_column(String, nullable=False, default="lunas")
    paid_amount: Mapped[int] = mapped_column(nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class DailyTransaction(Base):
    __tablename__ = "daily_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[int] = mapped_column(nullable=False)
    qty: Mapped[float | None] = mapped_column(nullable=True)
    qty_unit: Mapped[str | None] = mapped_column(String, nullable=True)
    feed_type: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class Debt(Base):
    __tablename__ = "debts"

    id: Mapped[int] = mapped_column(primary_key=True)
    lender_name: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[int] = mapped_column(nullable=False)
    loan_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    interest_rate: Mapped[float] = mapped_column(nullable=False, default=0)
    paid_amount: Mapped[int] = mapped_column(nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class DropdownOption(Base):
    __tablename__ = "dropdown_options"
    __table_args__ = (UniqueConstraint("list_key", "value", name="uq_dropdown_option"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    list_key: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class EggPriceReference(Base):
    __tablename__ = "egg_price_references"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_key: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    price_text: Mapped[str | None] = mapped_column(String, nullable=True)
    price_value: Mapped[float | None] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
