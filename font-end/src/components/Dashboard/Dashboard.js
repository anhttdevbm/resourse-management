import React from 'react';
import {
    MDBContainer, MDBRow, MDBCol, MDBCard, MDBCardBody, MDBCardTitle,
    MDBCardText, MDBIcon, MDBProgress, MDBProgressBar, MDBListGroup,
    MDBListGroupItem
} from 'mdb-react-ui-kit';
import './Dashboard.scss';

const Dashboard = () => {
    return (
        <MDBContainer fluid className="dashboard">
            <div className="stars"></div>
            <div className="light-glow light-glow-1"></div>
            <div className="light-glow light-glow-2"></div>
            {/* Header */}
            <MDBRow className="mb-4">
                <MDBCol size="6">
                    <h2>Dashboard</h2>
                </MDBCol>
                <MDBCol size="6" className="text-end">
                    <MDBIcon fas icon="search me-3" />
                    <MDBIcon fas icon="heart me-3" />
                    <MDBIcon fas icon="cog" />
                </MDBCol>
            </MDBRow>

            <MDBRow>
                {/* Overview - Main Metric */}
                <MDBCol md="8">
                    <MDBRow className="mb-4">
                        <MDBCol>
                            <MDBCard className="text-center p-3">
                                <MDBCardBody>
                                    <MDBCardTitle>Ccclients</MDBCardTitle>
                                    <h1>63,336</h1>
                                </MDBCardBody>
                            </MDBCard>
                        </MDBCol>
                    </MDBRow>

                    {/* Bar Chart Section */}
                    <MDBRow>
                        <MDBCol>
                            <MDBCard className="p-3">
                                <MDBCardTitle>New Assets</MDBCardTitle>
                                <MDBCardBody>
                                    <MDBRow className="align-items-end">
                                        <MDBCol size="2">
                                            <MDBProgress>
                                                <MDBProgressBar bgColor="info" width="60" />
                                            </MDBProgress>
                                        </MDBCol>
                                        <MDBCol size="2">
                                            <MDBProgress>
                                                <MDBProgressBar bgColor="info" width="40" />
                                            </MDBProgress>
                                        </MDBCol>
                                        <MDBCol size="2">
                                            <MDBProgress>
                                                <MDBProgressBar bgColor="info" width="80" />
                                            </MDBProgress>
                                        </MDBCol>
                                        <MDBCol size="2">
                                            <MDBProgress>
                                                <MDBProgressBar bgColor="info" width="50" />
                                            </MDBProgress>
                                        </MDBCol>
                                        <MDBCol size="2">
                                            <MDBProgress>
                                                <MDBProgressBar bgColor="info" width="70" />
                                            </MDBProgress>
                                        </MDBCol>
                                    </MDBRow>
                                </MDBCardBody>
                            </MDBCard>
                        </MDBCol>
                    </MDBRow>
                </MDBCol>

                {/* Additional Info */}
                <MDBCol md="4">
                    <MDBRow className="mb-4">
                        <MDBCol>
                            <MDBCard className="text-center p-3">
                                <MDBCardBody>
                                    <MDBCardTitle>New Assets</MDBCardTitle>
                                    <h2>40%</h2>
                                    <MDBCardText>Recet activitels</MDBCardText>
                                </MDBCardBody>
                            </MDBCard>
                        </MDBCol>
                    </MDBRow>

                    <MDBRow className="mb-4">
                        <MDBCol>
                            <MDBCard className="p-3">
                                <MDBCardTitle>Recent Activity</MDBCardTitle>
                                <MDBListGroup flush>
                                    <MDBListGroupItem>Pcwilde</MDBListGroupItem>
                                    <MDBListGroupItem>Resguce</MDBListGroupItem>
                                    <MDBListGroupItem>Lesage rider</MDBListGroupItem>
                                    <MDBListGroupItem>Designple</MDBListGroupItem>
                                </MDBListGroup>
                            </MDBCard>
                        </MDBCol>
                    </MDBRow>

                    <MDBRow>
                        <MDBCol>
                            <MDBCard className="text-center p-3">
                                <MDBCardBody>
                                    <MDBCardTitle>Recent Activity</MDBCardTitle>
                                    <h2>6°C</h2>
                                    <MDBCardText>10%</MDBCardText>
                                </MDBCardBody>
                            </MDBCard>
                        </MDBCol>
                    </MDBRow>
                </MDBCol>
            </MDBRow>
        </MDBContainer>
    );
};

export default Dashboard;
