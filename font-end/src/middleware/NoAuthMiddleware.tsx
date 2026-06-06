import { PropsWithChildren, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../redux/store";
import { cookieStorage } from "../utils/cookie";

const LoginMiddleware = ({ children }: PropsWithChildren) => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const [checkedAuth, setCheckedAuth] = useState<boolean>(false)

    useEffect(() => {
        const checkAuthenticate = () => {
            const accessToken = cookieStorage.getItem("accessToken");
            
            // Nếu đã có token và user data trong Redux, chuyển đến dashboard
            if (isAuthenticated && user && accessToken) {
                navigate('/dashboard');
                return;
            }
            
            // Nếu có token nhưng chưa có user data, có thể token đã hết hạn
            // hoặc chưa được validate. Trong trường hợp này, chúng ta sẽ
            // để user ở lại trang login và để AuthMiddleware xử lý việc validate token
            if (accessToken && !isAuthenticated) {
                // Token có thể đã hết hạn, để user ở lại login
                setCheckedAuth(true);
                return;
            }
            
            // Không có token, user có thể đăng nhập
            setCheckedAuth(true);
        }
        
        checkAuthenticate();
    }, []); // Chỉ chạy một lần khi component mount

    return checkedAuth ? children : null;
};

export default LoginMiddleware;
