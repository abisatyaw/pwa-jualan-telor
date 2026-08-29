from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

PaymentStatus = Literal["lunas", "hutang"]
UserRole = Literal["admin", "user"]


# ---------- Auth / Users ----------


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class UserCreate(BaseModel):
    username: str = Field(min_length=3)
    password: str = Field(min_length=8)
    role: UserRole = "user"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: UserRole
    created_at: datetime


# ---------- Settings (scalar) ----------


class KotakConversion(BaseModel):
    value: float = Field(gt=0)


# ---------- Dropdown Options ----------


class DropdownOptionCreate(BaseModel):
    list_key: str = Field(min_length=1)
    value: str = Field(min_length=1)


class DropdownOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    list_key: str
    value: str


# ---------- Asset ----------


class AssetBase(BaseModel):
    asset_name: str = Field(min_length=1)
    asset_type: str = Field(min_length=1)
    acquisition_price: int = Field(ge=0)
    acquisition_date: date
    depreciation_months: int = Field(ge=0, default=0)
    chicken_group: str | None = None
    chicken_age_weeks_at_purchase: int | None = Field(default=None, ge=0)
    notes: str | None = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(AssetBase):
    pass


class AssetOut(AssetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    monthly_depreciation: int
    book_value: int
    current_age_weeks: int | None = None


# ---------- Production ----------


class ProductionBase(BaseModel):
    production_date: date
    chicken_group: str = Field(min_length=1)
    quantity_kg: float = Field(ge=0)
    notes: str | None = None


class ProductionCreate(ProductionBase):
    pass


class ProductionUpdate(ProductionBase):
    pass


class ProductionOut(ProductionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ---------- Sale ----------


class SaleBase(BaseModel):
    sale_date: date
    product_type: str = Field(min_length=1)
    quantity: float = Field(gt=0)
    unit: str = Field(min_length=1)
    unit_price: int = Field(ge=0)
    buyer_name: str = Field(min_length=1)
    payment_status: PaymentStatus = "lunas"
    paid_amount: int = Field(default=0, ge=0)
    notes: str | None = None


class SaleCreate(SaleBase):
    pass


class SaleUpdate(SaleBase):
    pass


class SalePayment(BaseModel):
    paid_amount: int = Field(ge=0)


class SaleOut(SaleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_price: int
    remaining_amount: int
    created_at: datetime
    updated_at: datetime


# ---------- Daily Transaction ----------


class TransactionBase(BaseModel):
    transaction_date: date
    category: str = Field(min_length=1)
    amount: int = Field(ge=0)
    qty: float | None = Field(default=None, ge=0)
    qty_unit: str | None = None
    feed_type: str | None = None
    notes: str | None = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    qty_per_group: float | None = None
    created_at: datetime
    updated_at: datetime


# ---------- Debt ----------


class DebtBase(BaseModel):
    lender_name: str = Field(min_length=1)
    amount: int = Field(ge=0)
    loan_date: date
    due_date: date | None = None
    interest_rate: float = Field(default=0, ge=0)
    paid_amount: int = Field(default=0, ge=0)
    notes: str | None = None


class DebtCreate(DebtBase):
    pass


class DebtUpdate(DebtBase):
    pass


class DebtPayment(BaseModel):
    paid_amount: int = Field(ge=0)


class DebtOut(DebtBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    outstanding: int
    status: Literal["belum_lunas", "lunas"]
    created_at: datetime
    updated_at: datetime


# ---------- Dashboard ----------


class ProductionTrendPoint(BaseModel):
    label: str
    quantity_kg: float


class ProductionSummary(BaseModel):
    total_kg: float
    by_group: dict[str, float]
    trend: list[ProductionTrendPoint]


class WeeklyTransactionRow(BaseModel):
    week_label: str
    category: str
    amount: int


class ReceivableRow(BaseModel):
    sale_id: int
    sale_date: date
    buyer_name: str
    total_price: int
    paid_amount: int
    remaining_amount: int


class EggPriceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    source_key: str
    label: str
    url: str
    price_text: str | None
    price_value: float | None
    status: str
    fetched_at: datetime | None


class StockPosition(BaseModel):
    total_production_kg: float
    total_purchased_kg: float
    total_sold_kg: float
    stock_kg: float
    stock_kotak: float
    egg_prices: list[EggPriceOut]


class DashboardOverview(BaseModel):
    production: ProductionSummary
    weekly_transactions: list[WeeklyTransactionRow]
    receivables: list[ReceivableRow]
    total_receivable: int
    debts_outstanding: int
    stock: StockPosition
    expense_total: int
    sales_total: int
