import os
from collections import defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models, schemas, scraper, security

DEFAULT_OPTIONS: dict[str, list[str]] = {
    "asset_type": ["Kandang", "Peralatan", "Ayam", "Lainnya"],
    "chicken_group": ["Kelompok 1", "Kelompok 2"],
    "sale_product_type": ["Telur", "Ayam", "Lainnya"],
    "sale_unit": ["Kg", "Kotak", "Ekor", "Pcs"],
    "transaction_category": [
        "Perbaikan Kandang",
        "Pembersihan Kandang",
        "Transportasi",
        "Bensin",
        "Listrik",
        "Air PDAM",
        "Obat Ayam",
        "Vaksinasi",
        "Pakan",
        "Pembelian Telor",
        "Pembelian Ayam",
        "Pembelian Kotak Telur",
        "Lain-lain",
    ],
    "feed_type": ["Konsentrat", "Jagung", "Dedak", "Pakan Jadi (BR)", "Lainnya"],
}

DEFAULT_KOTAK_TO_KG = 15.0
KOTAK_TO_KG_SETTING_KEY = "kotak_to_kg"


def kg_equivalent(qty: float | None, unit: str | None, kotak_to_kg: float) -> float:
    if not qty:
        return 0.0
    if unit and unit.strip().lower() == "kotak":
        return qty * kotak_to_kg
    return qty


def _months_between(start: date, end: date) -> int:
    months = (end.year - start.year) * 12 + (end.month - start.month)
    if end.day < start.day:
        months -= 1
    return max(months, 0)


# ---------- Dropdown Options ----------


def get_options(db: Session, list_key: str) -> list[models.DropdownOption]:
    stmt = (
        select(models.DropdownOption)
        .where(models.DropdownOption.list_key == list_key)
        .order_by(models.DropdownOption.value)
    )
    return list(db.scalars(stmt))


class DuplicateOptionError(Exception):
    pass


def create_option(db: Session, payload: schemas.DropdownOptionCreate) -> models.DropdownOption:
    value = payload.value.strip()
    existing = db.scalars(
        select(models.DropdownOption).where(
            models.DropdownOption.list_key == payload.list_key,
            func.lower(models.DropdownOption.value) == value.lower(),
        )
    ).first()
    if existing is not None:
        raise DuplicateOptionError()
    option = models.DropdownOption(list_key=payload.list_key, value=value)
    db.add(option)
    db.commit()
    db.refresh(option)
    return option


def get_option(db: Session, option_id: int) -> models.DropdownOption | None:
    return db.get(models.DropdownOption, option_id)


def delete_option(db: Session, option: models.DropdownOption) -> None:
    db.delete(option)
    db.commit()


def seed_default_options(db: Session) -> None:
    for list_key, values in DEFAULT_OPTIONS.items():
        existing = db.scalars(
            select(models.DropdownOption.id).where(models.DropdownOption.list_key == list_key)
        ).first()
        if existing is not None:
            continue
        for value in values:
            db.add(models.DropdownOption(list_key=list_key, value=value))
    db.commit()


def seed_egg_price_sources(db: Session) -> None:
    for source in scraper.SOURCES:
        existing = db.scalars(
            select(models.EggPriceReference).where(
                models.EggPriceReference.source_key == source["source_key"]
            )
        ).first()
        if existing is not None:
            continue
        db.add(
            models.EggPriceReference(
                source_key=source["source_key"],
                label=source["label"],
                url=source["url"],
                status="pending",
            )
        )
    db.commit()


def seed_default_settings(db: Session) -> None:
    if db.get(models.Setting, KOTAK_TO_KG_SETTING_KEY) is None:
        db.add(models.Setting(key=KOTAK_TO_KG_SETTING_KEY, value=str(DEFAULT_KOTAK_TO_KG)))
        db.commit()


DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "admin"


def seed_admin_user(db: Session) -> None:
    if db.scalars(select(models.User.id)).first() is not None:
        return
    env_username = os.getenv("ADMIN_USERNAME")
    env_password = os.getenv("ADMIN_PASSWORD")
    if not env_username or not env_password:
        print(
            "[seed_admin_user] ADMIN_USERNAME/ADMIN_PASSWORD not set - "
            f"created default admin '{DEFAULT_ADMIN_USERNAME}'/'{DEFAULT_ADMIN_PASSWORD}'. "
            "Change this password after logging in."
        )
    create_user(db, env_username or DEFAULT_ADMIN_USERNAME, env_password or DEFAULT_ADMIN_PASSWORD, "admin")


# ---------- Users ----------


def get_user(db: Session, user_id: int) -> models.User | None:
    return db.get(models.User, user_id)


def get_user_by_username(db: Session, username: str) -> models.User | None:
    return db.scalars(select(models.User).where(models.User.username == username)).first()


def get_users(db: Session) -> list[models.User]:
    return list(db.scalars(select(models.User).order_by(models.User.username)))


def create_user(db: Session, username: str, password: str, role: str) -> models.User:
    user = models.User(username=username, password_hash=security.hash_password(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: models.User) -> None:
    db.delete(user)
    db.commit()


# ---------- Sessions ----------


def create_session(db: Session, user: models.User) -> models.Session:
    session = models.Session(
        token=security.generate_token(),
        user_id=user.id,
        expires_at=datetime.utcnow() + security.SESSION_TTL,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session_by_token(db: Session, token: str) -> models.Session | None:
    return db.scalars(select(models.Session).where(models.Session.token == token)).first()


def touch_session(db: Session, session: models.Session) -> None:
    session.expires_at = datetime.utcnow() + security.SESSION_TTL
    db.commit()


def delete_session(db: Session, token: str) -> None:
    session = get_session_by_token(db, token)
    if session is not None:
        db.delete(session)
        db.commit()


# ---------- Settings (scalar) ----------


def get_kotak_to_kg(db: Session) -> float:
    setting = db.get(models.Setting, KOTAK_TO_KG_SETTING_KEY)
    return float(setting.value) if setting else DEFAULT_KOTAK_TO_KG


def set_kotak_to_kg(db: Session, value: float) -> float:
    setting = db.get(models.Setting, KOTAK_TO_KG_SETTING_KEY)
    if setting is None:
        db.add(models.Setting(key=KOTAK_TO_KG_SETTING_KEY, value=str(value)))
    else:
        setting.value = str(value)
    db.commit()
    return value


# ---------- Asset ----------


def asset_to_out(asset: models.Asset) -> schemas.AssetOut:
    today = date.today()
    monthly_depreciation = (
        round(asset.acquisition_price / asset.depreciation_months)
        if asset.depreciation_months > 0
        else 0
    )
    months_elapsed = _months_between(asset.acquisition_date, today)
    accumulated = min(asset.acquisition_price, monthly_depreciation * months_elapsed)
    book_value = asset.acquisition_price - accumulated
    current_age_weeks = None
    if asset.chicken_age_weeks_at_purchase is not None:
        weeks_elapsed = max((today - asset.acquisition_date).days // 7, 0)
        current_age_weeks = asset.chicken_age_weeks_at_purchase + weeks_elapsed
    return schemas.AssetOut(
        id=asset.id,
        asset_name=asset.asset_name,
        asset_type=asset.asset_type,
        acquisition_price=asset.acquisition_price,
        acquisition_date=asset.acquisition_date,
        depreciation_months=asset.depreciation_months,
        chicken_group=asset.chicken_group,
        chicken_age_weeks_at_purchase=asset.chicken_age_weeks_at_purchase,
        notes=asset.notes,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
        monthly_depreciation=monthly_depreciation,
        book_value=book_value,
        current_age_weeks=current_age_weeks,
    )


def get_assets(db: Session, asset_type: str | None = None, search: str | None = None) -> list[models.Asset]:
    stmt = select(models.Asset)
    if asset_type:
        stmt = stmt.where(models.Asset.asset_type == asset_type)
    if search:
        stmt = stmt.where(models.Asset.asset_name.ilike(f"%{search}%"))
    stmt = stmt.order_by(models.Asset.acquisition_date.desc())
    return list(db.scalars(stmt))


def get_asset(db: Session, asset_id: int) -> models.Asset | None:
    return db.get(models.Asset, asset_id)


def create_asset(db: Session, payload: schemas.AssetCreate) -> models.Asset:
    asset = models.Asset(**payload.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def update_asset(db: Session, asset: models.Asset, payload: schemas.AssetUpdate) -> models.Asset:
    for key, value in payload.model_dump().items():
        setattr(asset, key, value)
    db.commit()
    db.refresh(asset)
    return asset


def delete_asset(db: Session, asset: models.Asset) -> None:
    db.delete(asset)
    db.commit()


# ---------- Production ----------


def get_productions(
    db: Session,
    date_from: date | None = None,
    date_to: date | None = None,
    chicken_group: str | None = None,
) -> list[models.Production]:
    stmt = select(models.Production)
    if date_from:
        stmt = stmt.where(models.Production.production_date >= date_from)
    if date_to:
        stmt = stmt.where(models.Production.production_date <= date_to)
    if chicken_group:
        stmt = stmt.where(models.Production.chicken_group == chicken_group)
    stmt = stmt.order_by(models.Production.production_date.desc())
    return list(db.scalars(stmt))


def get_production(db: Session, production_id: int) -> models.Production | None:
    return db.get(models.Production, production_id)


def create_production(db: Session, payload: schemas.ProductionCreate) -> models.Production:
    production = models.Production(**payload.model_dump())
    db.add(production)
    db.commit()
    db.refresh(production)
    return production


def update_production(
    db: Session, production: models.Production, payload: schemas.ProductionUpdate
) -> models.Production:
    for key, value in payload.model_dump().items():
        setattr(production, key, value)
    db.commit()
    db.refresh(production)
    return production


def delete_production(db: Session, production: models.Production) -> None:
    db.delete(production)
    db.commit()


# ---------- Sale ----------


def sale_to_out(sale: models.Sale) -> schemas.SaleOut:
    return schemas.SaleOut(
        id=sale.id,
        sale_date=sale.sale_date,
        product_type=sale.product_type,
        quantity=sale.quantity,
        unit=sale.unit,
        unit_price=sale.unit_price,
        total_price=sale.total_price,
        buyer_name=sale.buyer_name,
        payment_status=sale.payment_status,
        paid_amount=sale.paid_amount,
        remaining_amount=sale.total_price - sale.paid_amount,
        notes=sale.notes,
        created_at=sale.created_at,
        updated_at=sale.updated_at,
    )


def _sale_paid_amount(payload: schemas.SaleBase, total_price: int) -> int:
    if payload.payment_status == "lunas":
        return total_price
    return min(payload.paid_amount, total_price)


def get_sales(
    db: Session,
    date_from: date | None = None,
    date_to: date | None = None,
    product_type: str | None = None,
    payment_status: str | None = None,
    search: str | None = None,
) -> list[models.Sale]:
    stmt = select(models.Sale)
    if date_from:
        stmt = stmt.where(models.Sale.sale_date >= date_from)
    if date_to:
        stmt = stmt.where(models.Sale.sale_date <= date_to)
    if product_type:
        stmt = stmt.where(models.Sale.product_type == product_type)
    if payment_status:
        stmt = stmt.where(models.Sale.payment_status == payment_status)
    if search:
        stmt = stmt.where(models.Sale.buyer_name.ilike(f"%{search}%"))
    stmt = stmt.order_by(models.Sale.sale_date.desc())
    return list(db.scalars(stmt))


def get_sale(db: Session, sale_id: int) -> models.Sale | None:
    return db.get(models.Sale, sale_id)


def create_sale(db: Session, payload: schemas.SaleCreate) -> models.Sale:
    total_price = round(payload.quantity * payload.unit_price)
    data = payload.model_dump(exclude={"paid_amount"})
    sale = models.Sale(
        **data,
        total_price=total_price,
        paid_amount=_sale_paid_amount(payload, total_price),
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return sale


def update_sale(db: Session, sale: models.Sale, payload: schemas.SaleUpdate) -> models.Sale:
    total_price = round(payload.quantity * payload.unit_price)
    data = payload.model_dump(exclude={"paid_amount"})
    for key, value in data.items():
        setattr(sale, key, value)
    sale.total_price = total_price
    sale.paid_amount = _sale_paid_amount(payload, total_price)
    db.commit()
    db.refresh(sale)
    return sale


def record_sale_payment(db: Session, sale: models.Sale, payload: schemas.SalePayment) -> models.Sale:
    sale.paid_amount = min(payload.paid_amount, sale.total_price)
    sale.payment_status = "lunas" if sale.paid_amount >= sale.total_price else "hutang"
    db.commit()
    db.refresh(sale)
    return sale


def delete_sale(db: Session, sale: models.Sale) -> None:
    db.delete(sale)
    db.commit()


# ---------- Daily Transaction ----------


def transaction_to_out(transaction: models.DailyTransaction) -> schemas.TransactionOut:
    qty_per_group = None
    if transaction.category.strip().lower() == "pakan" and transaction.qty is not None:
        qty_per_group = round(transaction.qty / 2, 2)
    return schemas.TransactionOut(
        id=transaction.id,
        transaction_date=transaction.transaction_date,
        category=transaction.category,
        amount=transaction.amount,
        qty=transaction.qty,
        qty_unit=transaction.qty_unit,
        feed_type=transaction.feed_type,
        notes=transaction.notes,
        qty_per_group=qty_per_group,
        created_at=transaction.created_at,
        updated_at=transaction.updated_at,
    )


def get_transactions(
    db: Session,
    date_from: date | None = None,
    date_to: date | None = None,
    category: str | None = None,
    search: str | None = None,
) -> list[models.DailyTransaction]:
    stmt = select(models.DailyTransaction)
    if date_from:
        stmt = stmt.where(models.DailyTransaction.transaction_date >= date_from)
    if date_to:
        stmt = stmt.where(models.DailyTransaction.transaction_date <= date_to)
    if category:
        stmt = stmt.where(models.DailyTransaction.category == category)
    if search:
        stmt = stmt.where(models.DailyTransaction.notes.ilike(f"%{search}%"))
    stmt = stmt.order_by(models.DailyTransaction.transaction_date.desc())
    return list(db.scalars(stmt))


def get_transaction(db: Session, transaction_id: int) -> models.DailyTransaction | None:
    return db.get(models.DailyTransaction, transaction_id)


def create_transaction(db: Session, payload: schemas.TransactionCreate) -> models.DailyTransaction:
    transaction = models.DailyTransaction(**payload.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def update_transaction(
    db: Session, transaction: models.DailyTransaction, payload: schemas.TransactionUpdate
) -> models.DailyTransaction:
    for key, value in payload.model_dump().items():
        setattr(transaction, key, value)
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, transaction: models.DailyTransaction) -> None:
    db.delete(transaction)
    db.commit()


# ---------- Debt ----------


def debt_to_out(debt: models.Debt) -> schemas.DebtOut:
    outstanding = debt.amount - debt.paid_amount
    return schemas.DebtOut(
        id=debt.id,
        lender_name=debt.lender_name,
        amount=debt.amount,
        loan_date=debt.loan_date,
        due_date=debt.due_date,
        interest_rate=debt.interest_rate,
        paid_amount=debt.paid_amount,
        notes=debt.notes,
        outstanding=outstanding,
        status="lunas" if outstanding <= 0 else "belum_lunas",
        created_at=debt.created_at,
        updated_at=debt.updated_at,
    )


def get_debts(db: Session, search: str | None = None) -> list[models.Debt]:
    stmt = select(models.Debt)
    if search:
        stmt = stmt.where(models.Debt.lender_name.ilike(f"%{search}%"))
    stmt = stmt.order_by(models.Debt.loan_date.desc())
    return list(db.scalars(stmt))


def get_debt(db: Session, debt_id: int) -> models.Debt | None:
    return db.get(models.Debt, debt_id)


def create_debt(db: Session, payload: schemas.DebtCreate) -> models.Debt:
    debt = models.Debt(**payload.model_dump())
    db.add(debt)
    db.commit()
    db.refresh(debt)
    return debt


def update_debt(db: Session, debt: models.Debt, payload: schemas.DebtUpdate) -> models.Debt:
    for key, value in payload.model_dump().items():
        setattr(debt, key, value)
    db.commit()
    db.refresh(debt)
    return debt


def record_debt_payment(db: Session, debt: models.Debt, payload: schemas.DebtPayment) -> models.Debt:
    debt.paid_amount = min(payload.paid_amount, debt.amount)
    db.commit()
    db.refresh(debt)
    return debt


def delete_debt(db: Session, debt: models.Debt) -> None:
    db.delete(debt)
    db.commit()


# ---------- Egg price references ----------


def get_egg_prices(db: Session, refresh: bool = False) -> list[models.EggPriceReference]:
    rows = list(db.scalars(select(models.EggPriceReference)))
    stale = refresh or any(
        r.fetched_at is None or datetime.utcnow() - r.fetched_at > timedelta(hours=6) for r in rows
    )
    if stale:
        for result in scraper.fetch_all():
            row = db.scalars(
                select(models.EggPriceReference).where(
                    models.EggPriceReference.source_key == result["source_key"]
                )
            ).first()
            if row is None:
                continue
            row.price_text = result["price_text"]
            row.price_value = result["price_value"]
            row.status = result["status"]
            row.fetched_at = result["fetched_at"]
        db.commit()
        rows = list(db.scalars(select(models.EggPriceReference)))
    return sorted(rows, key=lambda r: r.source_key)


# ---------- Dashboard ----------


def _period_range(period: str, custom_from: date | None, custom_to: date | None) -> tuple[date, date]:
    import calendar

    today = date.today()
    if period == "today":
        return today, today
    if period == "week":
        start = today - timedelta(days=today.weekday())
        return start, start + timedelta(days=6)
    if period == "year":
        return today.replace(month=1, day=1), today.replace(month=12, day=31)
    if period == "custom" and custom_from and custom_to:
        return custom_from, custom_to
    last_day = calendar.monthrange(today.year, today.month)[1]
    return today.replace(day=1), today.replace(day=last_day)


def get_production_summary(
    db: Session, period: str, custom_from: date | None, custom_to: date | None
) -> schemas.ProductionSummary:
    date_from, date_to = _period_range(period, custom_from, custom_to)
    productions = get_productions(db, date_from=date_from, date_to=date_to)
    span_days = (date_to - date_from).days
    use_month_buckets = span_days > 62

    by_group: dict[str, float] = defaultdict(float)
    trend_map: dict[str, float] = defaultdict(float)
    total_kg = 0.0
    for p in productions:
        total_kg += p.quantity_kg
        by_group[p.chicken_group] += p.quantity_kg
        label = (
            p.production_date.strftime("%Y-%m") if use_month_buckets else p.production_date.strftime("%Y-%m-%d")
        )
        trend_map[label] += p.quantity_kg

    trend = [
        schemas.ProductionTrendPoint(label=label, quantity_kg=round(qty, 3))
        for label, qty in sorted(trend_map.items())
    ]
    return schemas.ProductionSummary(
        total_kg=round(total_kg, 3),
        by_group={k: round(v, 3) for k, v in by_group.items()},
        trend=trend,
    )


def get_weekly_transactions(db: Session, weeks: int = 8) -> list[schemas.WeeklyTransactionRow]:
    today = date.today()
    range_start = today - timedelta(weeks=weeks)
    transactions = get_transactions(db, date_from=range_start, date_to=today)
    totals: dict[tuple[str, str], int] = defaultdict(int)
    week_starts: dict[str, date] = {}
    for t in transactions:
        week_start = t.transaction_date - timedelta(days=t.transaction_date.weekday())
        label = week_start.strftime("%d-%m-%Y")
        week_starts[label] = week_start
        totals[(label, t.category)] += t.amount

    rows = [
        schemas.WeeklyTransactionRow(week_label=label, category=category, amount=amount)
        for (label, category), amount in totals.items()
    ]
    rows.sort(key=lambda r: (week_starts[r.week_label], r.category), reverse=True)
    return rows


def get_receivables(db: Session) -> list[schemas.ReceivableRow]:
    sales = get_sales(db, payment_status="hutang")
    return [
        schemas.ReceivableRow(
            sale_id=s.id,
            sale_date=s.sale_date,
            buyer_name=s.buyer_name,
            total_price=s.total_price,
            paid_amount=s.paid_amount,
            remaining_amount=s.total_price - s.paid_amount,
        )
        for s in sales
    ]


def get_stock_position(db: Session) -> schemas.StockPosition:
    kotak_to_kg = get_kotak_to_kg(db)
    total_production_kg = sum(p.quantity_kg for p in db.scalars(select(models.Production)))
    purchase_transactions = db.scalars(
        select(models.DailyTransaction).where(models.DailyTransaction.category == "Pembelian Telor")
    )
    total_purchased_kg = sum(kg_equivalent(t.qty, t.qty_unit, kotak_to_kg) for t in purchase_transactions)
    egg_sales = db.scalars(select(models.Sale).where(models.Sale.product_type == "Telur"))
    total_sold_kg = sum(kg_equivalent(s.quantity, s.unit, kotak_to_kg) for s in egg_sales)
    stock_kg = total_production_kg + total_purchased_kg - total_sold_kg
    egg_prices = get_egg_prices(db)
    return schemas.StockPosition(
        total_production_kg=round(total_production_kg, 3),
        total_purchased_kg=round(total_purchased_kg, 3),
        total_sold_kg=round(total_sold_kg, 3),
        stock_kg=round(stock_kg, 3),
        stock_kotak=round(stock_kg / kotak_to_kg, 3),
        egg_prices=[schemas.EggPriceOut.model_validate(p) for p in egg_prices],
    )


def get_dashboard_overview(
    db: Session, period: str, custom_from: date | None, custom_to: date | None
) -> schemas.DashboardOverview:
    date_from, date_to = _period_range(period, custom_from, custom_to)
    receivables = get_receivables(db)
    debts = get_debts(db)
    debts_outstanding = sum(d.amount - d.paid_amount for d in debts)
    period_sales = get_sales(db, date_from=date_from, date_to=date_to)
    period_transactions = get_transactions(db, date_from=date_from, date_to=date_to)
    return schemas.DashboardOverview(
        production=get_production_summary(db, period, custom_from, custom_to),
        weekly_transactions=get_weekly_transactions(db),
        receivables=receivables,
        total_receivable=sum(r.remaining_amount for r in receivables),
        debts_outstanding=debts_outstanding,
        stock=get_stock_position(db),
        expense_total=sum(t.amount for t in period_transactions),
        sales_total=sum(s.total_price for s in period_sales),
    )
