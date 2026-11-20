from datetime import datetime
from sqlalchemy import String, Integer, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.base import utc_now


class WeeklyProductionMetric(Base):
    __tablename__ = "weekly_production_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    week_label: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    day_of_week: Mapped[str] = mapped_column(String(10), nullable=False)  # Mon, Tue, Wed, Thu, Fri, Sat, Sun
    day_order: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 7
    target_units: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    actual_units: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    scrap_units: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_by: Mapped[str | None] = mapped_column(String(150), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("week_label", "day_of_week", name="uq_week_day"),
    )

