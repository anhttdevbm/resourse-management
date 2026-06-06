from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from decouple import config
import logging

logger = logging.getLogger(__name__)

# Lấy cấu hình database từ environment variables
try:
    DB_NAME = config("NAME_DB")
    DB_USER = config("USERNAME_DB")
    DB_PASS = config("PASSWORD_DB")
    DB_HOST = config("HOST_DB")
    DB_PORT = config("PORT_DB", cast=int)
    
    # Ghép chuỗi kết nối PostgreSQL
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    logger.info(f"Connecting to database at {DB_HOST}:{DB_PORT}/{DB_NAME}")
    
except Exception as e:
    logger.error(f"Error loading database configuration: {e}")
    raise ValueError(
        "Database configuration is missing or invalid. "
        "Please check your .env file and ensure the following variables are set:\n"
        "- NAME_DB\n"
        "- USERNAME_DB\n"
        "- PASSWORD_DB\n"
        "- HOST_DB\n"
        "- PORT_DB\n\n"
        "If running in Docker, use 'db' as HOST_DB instead of an IP address."
    )

# Khởi tạo engine với connection pooling và retry logic
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Kiểm tra kết nối trước khi sử dụng
    pool_recycle=3600,   # Tái tạo kết nối sau 1 giờ
    pool_size=10,        # Số lượng kết nối trong pool
    max_overflow=20,    # Số lượng kết nối tối đa có thể vượt quá pool_size
    echo=False           # Set True để debug SQL queries
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency để lấy database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()