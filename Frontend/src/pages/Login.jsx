import React, { useState, useEffect } from "react";
import Helmet from '../components/Helmet/Helmet';
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.config";
import { toast } from 'react-toastify';
import '../styles/login.css';

const Login = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const signInWithEmail = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      setLoading(false);
      toast.success('Login successful');
      navigate('/chatbot');
    } catch (error) {
      setLoading(false);
      if (error.code === "auth/user-not-found") {
        toast.error('User not found. Please sign up to continue.');
      } else if (error.code === "auth/wrong-password") {
        toast.error('Wrong password. Please try again.');
      } else {
        toast.error('An error occurred. Please try again later.');
      }
    }
  };

  

  return (
    <Helmet title='Login'>
      <section className="sect__bg">
        <Container>
          <Row>
            {loading ? (
              <Col lg='12' className="text-center">
                <h5 className="fw-bold">Loading...</h5>
              </Col>
            ) : (
              <Col lg='6' className="m-auto text-center">
                <h3 className="fw-bold fs-2 mb-4 dochead">Welcome Back!</h3>
                <h6 className="mb-4">Login to continue</h6>

                <Form className="auth__form" onSubmit={signInWithEmail}>
                 
                  <FormGroup className="form__group">
                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
                  </FormGroup>
                  <FormGroup className="form__group">
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                  </FormGroup>

                  <button type="submit" className="buy__button auth__btn">Let's go</button>
                  <p>Don't have an account? <Link to='/signup'>Sign Up</Link></p>
                </Form>
              </Col>
            )}
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default Login;