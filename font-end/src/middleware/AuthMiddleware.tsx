import { PropsWithChildren, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../redux/store";
import { fetchUser } from "../services/AuthService";
import { setAuthLogin, setAuthLogout } from "../redux/slice/authSlice";
import { useDispatch } from "react-redux"
import LoadingSpinner from "../components/LoadingSpinner";
import { cookieStorage } from "../utils/cookie";

const AuthMiddleware = ({ children }: PropsWithChildren) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const [isChecking, setIsChecking] = useState<boolean>(false);

    useEffect(() => {
        const checkAuthenticate = async () => {
            const accessToken = cookieStorage.getItem("accessToken");
            
            if (!accessToken) {
                dispatch(setAuthLogout());
                navigate('/login');
                return;
            }

            setIsChecking(true);
            try {
                const userData = await fetchUser();
                if (userData) {
                    dispatch(setAuthLogin(userData));
                } else {
                    dispatch(setAuthLogout());
                    navigate('/login');
                }
            } catch (error) {
                console.log('Token validation failed:', error);
                cookieStorage.removeItem("accessToken");
                cookieStorage.removeItem("refreshToken");
                cookieStorage.removeItem("user");
                dispatch(setAuthLogout());
                navigate('/login');
            } finally {
                setIsChecking(false);
            }
        };
        
        checkAuthenticate();
    }, []); // Chỉ chạy một lần khi component mount

    // Hiển thị loading khi đang kiểm tra authentication
    if (isChecking) {
        return <LoadingSpinner message="Đang kiểm tra xác thực..." />;
    }

    // Chỉ hiển thị children khi đã authenticated và có user data
    return isAuthenticated && user ? children : null;
};

export default AuthMiddleware;
