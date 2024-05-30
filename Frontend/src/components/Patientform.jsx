import React, { useState } from 'react';
import { auth, db } from '../firebase.config';
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { Col } from 'reactstrap';

const generateRandomId = () => {
  return Math.floor(Math.random() * 1000000); 
};

const PatientForm = ({ doctorName, setShowForm, refetchPatientNames }) => {
  const [patientData, setPatientData] = useState({
    "id": generateRandomId(),
    "name": '',
    "gender": '',
    "age": '',
    "dob": '',
    "temperature": '',
    "pulse": '',
    "bloodPressure": '',
    "height": '',
    "weight": '',
    "condition": '',
    "description": '',
    "symptoms": '',
    "personalHistory": '',
    "familyHistory": '',
    "allergies": '',
    "medications": '',
    "reports": '',
    "remarks": ''
  });

  
  const handleFormInputChange = (event) => {
    const { name, value } = event.target;
    setPatientData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {

      const reqstring = new URLSearchParams({ req: JSON.stringify(patientData) }).toString();
const response = await fetch(`http://localhost:8000/create?${reqstring}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
});
console.log(reqstring)

      
      const docRef = await addDoc(collection(db, 'patients'), patientData);
      console.log("Patient added with ID: ", docRef.id);

      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'doctors', user.uid, 'patients', docRef.id), {
          ...patientData,
          doctor: doctorName
        });
      }

      setPatientData({
        name: '',
        gender: '',
        age: '',
        dob: '',
        temperature: '',
        pulse: '',
        bloodPressure: '',
        height: '',
        weight: '',
        condition: '',
        description: '',
        symptoms: '',
        personalHistory: '',
        familyHistory: '',
        allergies: '',
        medications: '',
        reports: '',
        remarks: ''
      });
      setShowForm(false);
      refetchPatientNames(); 
    } catch (error) {
      console.error("Error adding patient: ", error);
    }
  };


return (
  <Col className='formm' lg='12'>
    <form className='patient__form formm' onSubmit={handleFormSubmit}>
      <div className="namegend">
        <input type="text" name="name" placeholder='Name' value={patientData.name} onChange={handleFormInputChange} required />
        <input className='gender' type="text" name="gender" placeholder='Gender' value={patientData.gender} onChange={handleFormInputChange} />
      </div>
      <div className="numbers">
        <input type="number" name="age" placeholder='Age' value={patientData.age} onChange={handleFormInputChange} required />
        <input type="number" name="temperature" placeholder='Temperature' value={patientData.temperature} onChange={handleFormInputChange} />
        <input type="number" name="pulse" placeholder='Pulse' value={patientData.pulse} onChange={handleFormInputChange} />
      </div>
      <div className="numbers">
        <input type="text" name="bloodPressure" placeholder='Blood Pressure' value={patientData.bloodPressure} onChange={handleFormInputChange} />
        <input type="text" name="height" placeholder='Height' value={patientData.height} onChange={handleFormInputChange} />
        <input type="text" name="weight" placeholder='Weight' value={patientData.weight} onChange={handleFormInputChange} />
      </div>
      <input type="text" name="condition" placeholder='Medical Condition' value={patientData.condition} onChange={handleFormInputChange} />
      <textarea name="description" placeholder='Description' value={patientData.description} onChange={handleFormInputChange}></textarea>
      <textarea name="symptoms" placeholder='Symptoms' value={patientData.symptoms} onChange={handleFormInputChange}></textarea>
      <textarea name="personalHistory" placeholder='Personal Medical History' value={patientData.personalHistory} onChange={handleFormInputChange}></textarea>
      <textarea name="familyHistory" placeholder='Family Medical History' value={patientData.familyHistory} onChange={handleFormInputChange}></textarea>
      <textarea name="allergies" placeholder='Allergies' value={patientData.allergies} onChange={handleFormInputChange}></textarea>
      <textarea name="medications" placeholder='Medications' value={patientData.medications} onChange={handleFormInputChange}></textarea>
      <input type="text" name="reports" placeholder='Reports' value={patientData.reports} onChange={handleFormInputChange} />
      <textarea name="remarks" placeholder='Remarks' value={patientData.remarks} onChange={handleFormInputChange}></textarea>
      <button type="submit">Add Patient</button>
    </form>
  </Col>
);
}

export default PatientForm;
