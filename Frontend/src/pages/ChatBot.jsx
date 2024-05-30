import React, { useState, useEffect } from 'react';
import Helmet from '../components/Helmet/Helmet';
import { Container, Row, Col } from "reactstrap";
import { auth, db } from '../firebase.config';
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import PatientForm from '../components/Patientform';
import PatientInfo from '../components/PatientInfo';

const ChatBot = () => {
  const [doctorName, setDoctorName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [patientNames, setPatientNames] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const fetchPatientNames = async () => {
      try {
        const patientsRef = collection(db, 'patients');
        const snapshot = await getDocs(patientsRef);
        const names = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setPatientNames(names);
      } catch (error) {
        console.error('Error fetching patient names:', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setDoctorName('Dr. ' + (user.displayName || 'No name set'));
      } else {
        setDoctorName('Dr. User');
      }
    });

    fetchPatientNames();

    return () => unsubscribe();
  }, []);

  const handleNewPatientClick = () => {
    setShowForm(true);
  };

  const handlePatientNameClick = (id) => {
    setSelectedPatient(id);
    setShowForm(false); 
  };

  const refetchPatientNames = async () => {
    try {
      const patientsRef = collection(db, 'patients');
      const snapshot = await getDocs(patientsRef);
      const names = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setPatientNames(names);
    } catch (error) {
      console.error('Error refetching patient names:', error);
    }
  };

  return (
    <Helmet title={"ChatBot"}>
      <Container className='containerr'>
        <Row className='chatbot'>
          <Col className='patients' lg='3'>
            <div className='patient__button' onClick={handleNewPatientClick}>
              New Patient <i className="ri-add-fill"></i>
            </div>
            <div className='patient__search'>
              <input type="text" placeholder='Search Patients' />
              <i className="ri-search-line"></i>
            </div>
            <div className="patientnames">
              <div className="line"></div>
              {patientNames.map((patient, index) => (
                <p className='patientname' key={index} onClick={() => handlePatientNameClick(patient.id)}>
                  {patient.name}
                </p>
              ))}
            </div>
            <div className="doctorname">
              <p>{doctorName}</p>
            </div>
          </Col>
          <Col lg='9'>
            {showForm ? (
              <div className="modelcont">
                <div className="model">
                  <PatientForm
                    doctorName={doctorName}
                    setShowForm={setShowForm}
                    refetchPatientNames={refetchPatientNames}
                  />
                </div>
              </div>
            ) : (
              selectedPatient && (
                <div className='model posfix'>
                  <PatientInfo
                    doctorName={doctorName}
                    setShowForm={setShowForm}
                    patientName={selectedPatient}
                  />
                </div>
              )
            )}
          </Col>
        </Row>
      </Container>
    </Helmet>
  );
};

export default ChatBot;
