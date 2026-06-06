"""Define check time."""
from datetime import datetime, timedelta

from app.src.base.error_code import BaseErrorCode


def check_time_str(time: str):
    """Define check time str."""
    end_time = datetime.now()
    time_properties = tuple(map(int, time.split('/')))
    if len(time_properties) == 2:
        month, year = time_properties
        start_time = datetime(year, month, 1, 23, 59, 59) - timedelta(days=1)
        if end_time.month != start_time.month:
            end_time = datetime(year, month, 1, 23, 59, 59) - timedelta(days=1)
    elif len(time_properties) == 3:
        day, month, year = time_properties
        start_time = datetime(year, month, day, 23, 59, 59) - timedelta(days=1)
        if end_time.date != start_time.date:
            end_time = datetime(year, month, day, 23, 59, 59)
    else:
        raise BaseErrorCode.WRONG_TIME_FORMAT.value
    return start_time, end_time