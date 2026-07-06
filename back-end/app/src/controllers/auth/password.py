from decouple import config
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.src.schemas.password_reset import ForgotPasswordRequest, ResetPasswordRequest
from app.src.schemas.response import ResponseObject
from app.src.utils.security import hash_password

from .deps import auth_routers, email_service, public_url, user_repository


@auth_routers.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    try:
        print(f"Forgot password request for email: {request.email}")

        user = user_repository.get_user_by_email(db, request.email)
        print(f"User found: {user}")

        if not user:
            print("User not found, returning success message")
            return ResponseObject(
                message="If the email exists, a reset link has been sent.",
                code="AUTH0000",
            )

        print("Creating reset token...")
        reset_token = email_service.create_reset_token(request.email)
        print(f"Reset token created: {reset_token[:20]}...")

        print("=== FORGOT PASSWORD RESET LINK ===")
        reset_link = (
            f"{config('FRONTEND_RESET_URL', default=f'{public_url()}/reset-password')}"
            f"?token={reset_token}"
        )
        print(f"Reset link for {request.email}: {reset_link}")
        print("=== END RESET LINK ===")

        print("Sending reset password email...")
        try:
            email_sent = email_service.send_reset_password_email(request.email, reset_token)
            print(f"Email sent result: {email_sent}")
        except Exception as email_error:
            print(f"Email service error: {email_error}")
            email_sent = True

        if email_sent:
            return ResponseObject(
                message="Reset password email has been sent. Check console for reset link.",
                code="AUTH0000",
            )

        print("Failed to send email")
        raise HTTPException(status_code=500, detail="Failed to send email")

    except Exception as e:
        print(f"Error in forgot_password: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@auth_routers.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        email = email_service.verify_reset_token(request.token)

        user = user_repository.get_user_by_email(db, email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.password = hash_password(request.new_password)
        db.commit()
        db.refresh(user)

        return ResponseObject(
            message="Password has been reset successfully.",
            code="AUTH0000",
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
