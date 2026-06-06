import { React, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MDBBtn,
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBInput,
    MDBIcon
}
    from 'mdb-react-ui-kit';
import '../../setting.scss'
import './Login.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';


function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [statusMessage, setStatusMessage] = useState('');
    const navigate = useNavigate();
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };
    const handleLogin = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        console.log(formData);

        try {
            const response = await fetch('http://localhost:30111/Resource%20Management/user/login/access-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            console.log("Response status:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("Full response data:", data);

                const token = data.data?.token;
                const user = data.data?.user;
                console.log("Access Token:", token);
                console.log("User:", user);

                if (token) {
                    setStatusMessage('Đăng nhập thành công!');
                    // Note: This file uses a different token key 'access_token' instead of 'accessToken'
                    // Consider migrating to use cookieStorage from utils/cookie
                    // For now, keeping localStorage for backward compatibility
                    localStorage.setItem('access_token', token);
                    navigate('/dashboard');
                } else {
                    setStatusMessage('Sai thông tin đăng nhập.');
                }
            } else {
                if (response.status === 401) {
                    setStatusMessage('Sai mật khẩu hoặc tên đăng nhập.');
                } else {
                    setStatusMessage('Đăng nhập thất bại. Vui lòng thử lại.');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            setStatusMessage('Lỗi kết nối. Vui lòng thử lại.');
        }
    };
    // Hàm xử lý khi nhấn "Quên mật khẩu"
    const handleForgotPassword = () => {
        console.log('Quên mật khẩu được nhấn');
    };
    // Hàm xử lý khi click vào một social icon button
    const handleSocialIconClick = (iconName) => {
        console.log(`Clicked social icon: ${iconName}`);
    };
    return (
        <MDBContainer fluid className='p-4 background-radial-gradient overflow-hidden height-800 pt-5'>
            <MDBRow>
                <MDBCol md='6' className='text-center text-md-start d-flex flex-column justify-content-center pt-20'>
                    <h1 className="my-5 display-3 fw-bold ls-tight px-3" style={{ color: 'hsl(218, 81%, 95%)' }}>
                        Welcome Back! <br />
                        <span style={{ color: 'hsl(218, 81%, 75%)' }}>Please login to your account</span>
                    </h1>
                    <p className='px-3' style={{ color: 'hsl(218, 81%, 85%)' }}>
                        Access your resources quickly and securely with our advanced hosting services.
                    </p>
                </MDBCol>
                <MDBCol md='6' className='position-relative'>
                    <div id="radius-shape-1" className="position-absolute rounded-circle shadow-5-strong"></div>
                    <div id="radius-shape-2" className="position-absolute shadow-5-strong"></div>
                    <MDBCard className='my-5 bg-glass'>
                        <MDBCardBody className='p-5'>
                            <form onSubmit={handleLogin}>
                                <MDBInput
                                    wrapperClass='mb-4'
                                    label='Email'
                                    id='email'
                                    type='text'
                                    name='email'
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                <MDBInput
                                    wrapperClass='mb-4'
                                    label='Password'
                                    id='password'
                                    type='password'
                                    name='password'
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <div className='d-flex justify-content-between mb-4'>
                                    <a href="#!" onClick={handleForgotPassword}>Quên mật khẩu?</a>
                                </div>

                                <MDBBtn type='submit' className='w-100 mb-4' size='md'>
                                    Login
                                </MDBBtn>
                            </form>
                            {statusMessage && (
                                <div className='text-center mb-4' style={{ color: 'red' }}>
                                    {statusMessage}
                                </div>
                            )}
                            <div className='text-center'>
                                <p>Login with:</p>
                                <MDBBtn tag='a' color='none' className='mx-3' style={{ color: '#1266f1' }} value='facebook' onClick={() => handleSocialIconClick('facebook')}>
                                    <MDBIcon fab icon='facebook-f' size='sm' />
                                </MDBBtn>

                                <MDBBtn tag='a' color='none' className='mx-3' style={{ color: '#1266f1' }} value='twitter' onClick={() => handleSocialIconClick('twitter')}>
                                    <MDBIcon fab icon='twitter' size="sm" />
                                </MDBBtn>

                                <MDBBtn tag='a' color='none' className='mx-3' style={{ color: '#1266f1' }} value='google' onClick={() => handleSocialIconClick('google')}>
                                    <MDBIcon fab icon='google' size="sm" />
                                </MDBBtn>

                                <MDBBtn tag='a' color='none' className='mx-3' style={{ color: '#1266f1' }} value='github' onClick={() => handleSocialIconClick('github')}>
                                    <MDBIcon fab icon='github' size="sm" />
                                </MDBBtn>
                            </div>
                        </MDBCardBody>
                    </MDBCard>
                </MDBCol>
            </MDBRow>
        </MDBContainer>
    );
}
export default Login;