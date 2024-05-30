import React, { useState, useRef, useEffect } from "react";
import Helmet from '../components/Helmet/Helmet';
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { setDoc, doc } from "firebase/firestore";
import { auth, storage, db } from '../firebase.config';
import { toast } from 'react-toastify';
import '../styles/login.css';

const Signup = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [medicalPracticeName, setMedicalPracticeName] = useState('');
  const [department, setDepartment] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const fileUploadRef = useRef(null);

  const signup = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!emailIsValid(email)) {
      setLoading(false);
      toast.error('Invalid email format. Please provide a valid email.');
      return;
    }

    if (!passwordIsValid(password)) {
      setLoading(false);
      toast.error('Password must be at least 8 characters long, contain a number, a special character, an uppercase and a lowercase letter.');
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      toast.error('Passwords do not match. Please confirm your password.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (file) {
        const storageRef = ref(storage, `images/${Date.now() + firstName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on("state_changed", (snapshot) => {}, (error) => {
          setLoading(false);
          toast.error(error.message);
        }, async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          await updateProfile(user, {
            displayName: `${firstName} ${lastName}`,
            photoURL: downloadURL
          });

          await setDoc(doc(db, 'doctors', user.uid), {
            uid: user.uid,
            firstName,
            lastName,
            email,
            phoneNumber,
            medicalLicenseNumber,
            specialization,
            medicalPracticeName,
            department,
            photoURL: downloadURL,
          });

          setLoading(false);
          toast.success('Account created successfully');
          navigate('/chatbot');
        });
      } else {
        await updateProfile(user, {
          displayName: `${firstName} ${lastName}`,
        });

        await setDoc(doc(db, 'doctors', user.uid), {
          uid: user.uid,
          firstName,
          lastName,
          email,
          phoneNumber,
          medicalLicenseNumber,
          specialization,
          medicalPracticeName,
          department,
          photoURL: null,
        });

        setLoading(false);
        toast.success('Account created successfully');
        navigate('/login');
      }
    } catch (error) {
      setLoading(false);
      toast.error('An error occurred during sign up. Please try again later.');
    }
  };

  const emailIsValid = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const passwordIsValid = (password) => {
    return /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(password);
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      return;
    }

    if (selectedFile.size > 5242880) { // 5 MB in bytes
      toast.error('Selected file is too large. Please choose a smaller image.');
      setFile(null);
    } else if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
      toast.error('Invalid file format. Please choose a JPEG or PNG image.');
      setFile(null);
    } else {
      setFile(selectedFile);
    }
  };

  return (
    <Helmet title='Doctor Signup'>
      <section className="sect__bg">
        <Container>
          <Row>
            {loading ? (
              <Col lg='12' className="text-center">
                <h5 className="fw-bold">Loading...</h5>
              </Col>
            ) : (
              <Col lg='6' className="m-auto text-center">
                <h3 className="fw-bold fs-2 mb-4 dochead">Doctor Signup</h3>
                <Form className="auth__form" onSubmit={signup}>
                  <FormGroup className="form__group">
                    <input type="text" placeholder="First Name" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </FormGroup>
                  <FormGroup className="form__group">
                    <input type="text" placeholder="Last Name" required value={lastName} onChange={e => setLastName(e.target.value)} />
                  </FormGroup>
                  <FormGroup className="form__group">
                    <input type="email" placeholder="E-mail" required value={email} onChange={e => setEmail(e.target.value)} />
                  </FormGroup>
                  <FormGroup className="form__group">
                    <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
                  </FormGroup>
                  <FormGroup className="form__group">
                    <input type="password" placeholder="Confirm Password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </FormGroup>
                  <FormGroup className="form__group">
                    <input type="text" placeholder="Phone Number" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                  </FormGroup>
                  <FormGroup className="form__group">
                    <input type="text" placeholder="Medical License Number" required value={medicalLicenseNumber} onChange={e => setMedicalLicenseNumber(e.target.value)} />
                  </FormGroup>
                  <FormGroup className="form__group">
                    <input type="text" placeholder="Specialization" required value={specialization} onChange={e => setSpecialization(e.target.value)} />
                  </FormGroup>
                  <FormGroup className="form__group">
                    <input type="text" placeholder="Medical Practice or Hospital Name" required value={medicalPracticeName} onChange={e => setMedicalPracticeName(e.target.value)} />
                  </FormGroup>
                  <FormGroup className="form__group">
                    <input type="text" placeholder="Department/Unit" value={department} onChange={e => setDepartment(e.target.value)} />
                  </FormGroup>
                  <FormGroup className="form__group">
                    <label htmlFor="fileUpload" className="pp_choose">Click here to choose a Profile Picture</label>
                    <input type="file" className="button_ok" placeholder="profile" id="fileUpload" accept="image/png, image/jpeg, image/jpg" onChange={handleFileUpload} ref={fileUploadRef} />
                  </FormGroup>
                  <button type="submit" className="buy__button auth__btn">Sign Up</button>
                  <p>Already have an account? <Link to='/login'>Login</Link></p>
                </Form>
              </Col>
            )}
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default Signup;
