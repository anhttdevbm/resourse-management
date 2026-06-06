import { React, useState } from 'react';
import {
    MDBBtn,
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBInput,
    MDBCheckbox,
    MDBIcon
}
    from 'mdb-react-ui-kit';
import './Registration.scss';
import '../../setting.scss'
import '@fortawesome/fontawesome-free/css/all.min.css';

function Registration() {
    // Khởi tạo state cho các trường nhập liệu
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        subscribe: false,
    });
    // Hàm xử lý khi có sự thay đổi trên các trường nhập liệu
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };
    // Hàm xử lý khi nút "Sign up" được nhấn
    const handleSignUp = (e) => {
        e.preventDefault();
        console.log('Thông tin đăng ký:', formData);
    };
    // Hàm xử lý khi click vào một social icon button
    const handleSocialIconClick = (iconName) => {
        console.log(`Clicked social icon: ${iconName}`);
    };
    return (
        <MDBContainer fluid className='p-4 background-radial-gradient overflow-hidden'>

            <MDBRow>

                <MDBCol md='6' className='text-center text-md-start d-flex flex-column justify-content-center'>

                    <h1 className="my-5 display-3 fw-bold ls-tight px-3" style={{ color: 'hsl(218, 81%, 95%)' }}>
                        The best hosting <br />
                        <span style={{ color: 'hsl(218, 81%, 75%)' }}>for you</span>
                    </h1>
                    <p className='px-3' style={{ color: 'hsl(218, 81%, 85%)' }}>
                        Discover a smart and secure digital resource storage solution. We are committed to protecting your data with cutting-edge technology, making it easy and fast for you to manage and access resources when you need them.
                    </p>

                </MDBCol>

                <MDBCol md='6' className='position-relative'>

                    <div id="radius-shape-1" className="position-absolute rounded-circle shadow-5-strong"></div>
                    <div id="radius-shape-2" className="position-absolute shadow-5-strong"></div>

                    <MDBCard className='my-5 bg-glass'>
                        <MDBCardBody className='p-5'>

                            <MDBRow>
                                <MDBCol col='6'>
                                    <MDBInput
                                        wrapperClass='mb-4'
                                        label='First Name'
                                        id='form1'
                                        type='text'
                                        name='firstName'
                                        value={formData.firstName}
                                        onChange={handleChange}
                                    />
                                </MDBCol>

                                <MDBCol col='6'>
                                    <MDBInput
                                        wrapperClass='mb-4'
                                        label='Last Name'
                                        id='form2'
                                        type='text'
                                        name='lastName'
                                        value={formData.lastName}
                                        onChange={handleChange}
                                    />
                                </MDBCol>
                            </MDBRow>

                            <MDBInput
                                wrapperClass='mb-4'
                                label='Email'
                                id='form3'
                                type='email'
                                name='email'
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <MDBInput
                                wrapperClass='mb-4'
                                label='Mật khẩu'
                                id='form4'
                                type='password'
                                name='password'
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <div className='d-flex justify-content-center mb-4'>
                                <MDBCheckbox
                                    name='flexCheck'
                                    value=''
                                    id='flexCheckDefault'
                                    label='Subscribe to our newsletter'
                                    checked={formData.subscribe}
                                    onChange={handleChange}
                                />
                            </div>

                            <MDBBtn className='w-100 mb-4' size='md' onClick={handleSignUp}>Sign up</MDBBtn>

                            <div className="text-center">

                                <p>or sign up with:</p>

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

export default Registration;