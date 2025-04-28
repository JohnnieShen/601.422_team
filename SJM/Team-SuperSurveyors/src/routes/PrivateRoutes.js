// src/routes/PrivateRoute.js
import React from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { Navigate, Outlet } from 'react-router-dom'
import { getAuth } from 'firebase/auth'
import { ClipLoader as Audio } from 'react-spinners'
import { Container } from 'react-bootstrap'

const PrivateRoute = ({ children }) => {
    const [user, loading, error] = useAuthState(getAuth())

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Audio color='#123abc' loading={loading} size={150} />
            </Container>
        )
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    if (!user) {
        return <Navigate to='/login' />
    }
    return <Outlet />
}

export default PrivateRoute
