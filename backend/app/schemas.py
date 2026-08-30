from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

PaymentStatus = Literal["lunas", "hutang"]
UserRole = Literal["admin", "user"]


# ---------- Auth / Users ----------


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = ""


class UserCreate(BaseModel):
    username: str = Field(min_length=1)
    # Password complexity is intentionally not enforced yet (see feedback AUTH-004):
    # admin-created accounts may have an empty password until a real policy is set.
    password: str = ""
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


class AverageEggWeight(BaseModel):
    # kg per egg; used as a divisor for estimated egg count, so must be > 0
    value: float = Field(gt=0)


class HdpTarget(BaseModel):
    # target Hen Day Production as a percentage
    value: float = Field(ge=0, le=100)


class FcrTarget(BaseModel):
    value: float = Field(gt=0)


class FcrTargetOut(BaseModel):
    # value is None until the business confirms a real target (see crud.get_fcr_target)
    value: float | None = None


class KgPerKarungRow(BaseModel):
    feed_type: str
    value: float


class KgPerKarungUpdate(BaseModel):
    feed_type: str = Field(min_length=1)
    value: float = Field(ge=0)


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
    quantity: int = Field(default=1, gt=0)
    # per-unit price; the depreciable basis is quantity * acquisition_price
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
    total_acquisition_value: int
    monthly_depreciation: int
    book_value: int
    book_value_zero_date: date | None = None
    current_age_weeks: int | None = None


# ---------- Production ----------


class ProductionBase(BaseModel):
    production_date: date
    chicken_group: str = Field(min_length=1)
    quantity_kg: float = Field(ge=0)
    # average weight of one egg in kg; None on input means "use the current setting"
    average_egg_weight_kg: float | None = Field(default=None, gt=0)
    notes: str | None = None


class ProductionCreate(ProductionBase):
    pass


class ProductionUpdate(ProductionBase):
    pass


class ProductionOut(ProductionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    average_egg_weight_kg: float
    estimated_egg_count: int
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
    # when qty and unit_price are both given, the server recomputes amount = qty * unit_price
    amount: int = Field(ge=0)
    qty: float | None = Field(default=None, ge=0)
    qty_unit: str | None = None
    unit_price: int | None = Field(default=None, ge=0)
    feed_type: str | None = None
    notes: str | None = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
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


class ProductionWeekPoint(BaseModel):
    week_label: str
    total_kg: float


class ProductionSummary(BaseModel):
    total_kg: float
    by_group: dict[str, float]
    trend: list[ProductionTrendPoint]
    weekly: list[ProductionWeekPoint]


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


class MetricPoint(BaseModel):
    label: str
    value: float


class FcrSummary(BaseModel):
    # feed consumed (kg) / eggs produced (kg) for the selected period; None when
    # there is no production to divide by
    value: float | None
    target: float | None  # from the fcr_target setting; None = not configured
    trend: list[MetricPoint]  # one point per month in range


class HdpSummary(BaseModel):
    # mean Hen Day Production % over the selected period
    value: float | None
    target: float  # hdp_target_percentage setting (default 85)
    trend: list[MetricPoint]


class DashboardOverview(BaseModel):
    production: ProductionSummary
    weekly_transactions: list[WeeklyTransactionRow]
    receivables: list[ReceivableRow]
    total_receivable: int
    debts_outstanding: int
    stock: StockPosition
    fcr: FcrSummary
    hdp: HdpSummary
    expense_total: int
    sales_total: int
