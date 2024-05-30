import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import Modal from 'react-modal'; 
import { db } from '../firebase.config';
import "../styles/chatbot.css";
import ReactMarkdown from 'react-markdown';


const PatientInfo = ({ setShowForm, patientName }) => {
  const [patientInfo, setPatientInfo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [botResponse, setBotResponse] = useState(null);

  const chatRef = useRef(null);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  useEffect(() => {
    if (!patientName) {
      console.log("No patient name provided");
      return;
    }

    const patientRef = doc(db, 'patients', patientName);
    const unsubscribe = onSnapshot(patientRef, (snapshot) => {
      if (snapshot.exists()) {
        setPatientInfo(snapshot.data());
      } else {
        console.log("Patient not found");
      }
    });

    return () => unsubscribe();
  }, [patientName]);

  useEffect(() => {
    if (chatRef.current) {
      setTimeout(() => {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 100);
    }
  }, [patientInfo?.chat]);

  const handleSendClick = async () => {
    if (!inputValue.trim()) return;
  
    const patientRef = doc(db, 'patients', patientName);
    const patientSnapshot = await getDoc(patientRef);
    if (!patientSnapshot.exists()) {
      console.log("Patient not found");
      return;
    }
  
    const updatedPatientData = {
      ...patientSnapshot.data(),
      chat: {
        ...patientSnapshot.data().chat,
        [Date.now()]: { type: 'doctor', message: inputValue }
      }
    };
  
    await updateDoc(patientRef, updatedPatientData);

    const postData = {
      id: patientInfo?.id,
      prompt: inputValue
    };

    const reqstring = new URLSearchParams({ req: JSON.stringify(postData) }).toString();

    try {
      const response = await fetch(`http://localhost:8000/query?${reqstring}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        
      });


      if (response.ok) {
        const responseData = await response.json(); 
        console.log("Received bot response:", responseData);

        const updatedChat = {
          ...updatedPatientData.chat,
          [Date.now() + 1]: { type: 'bot', message: responseData.Output } 
        };
  
        await updateDoc(patientRef, { ...updatedPatientData, chat: updatedChat });
  
        console.log('Message sent successfully to localhost:8000/query');
        setBotResponse(responseData.Output); 
      } else {
        console.error('Failed to send message to server');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  
    setInputValue(''); 
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSendClick();
    }
  };

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };


  return (
    <div className="main">
      <div className="patientinfoo">
        <div className="namecondition">
          <h5>{patientInfo?.name}</h5>
          <p>{patientInfo?.condition}</p>
        </div>
        <button onClick={openModal}>View Patient Information</button>
      </div>
      <div className="chat" ref={chatRef}>
      {patientInfo && patientInfo.chat &&
  Object.entries(patientInfo.chat)
    .sort(([timestampA], [timestampB]) => timestampA - timestampB)
    .map(([timestamp, message]) => {
      if (message.type === 'doctor') {
        return (
          <div className="doctormessage" key={timestamp}>
            <div></div>
            <p>{message.message}</p>
          </div>
        );
      } else if (message.type === 'bot') {
        return (
          <div className="botmessage" key={timestamp}>
            <p><ReactMarkdown>{message.message}</ReactMarkdown></p>
            <div></div>
          </div>
        );
      }
      return null;
    })}

      </div>
      <div className="input">
        <input
          type="text"
          placeholder='How can I assist you with your patient today?'
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <div className={`send ${inputValue ? 'active' : ''}`} onClick={handleSendClick}>
          <i className="ri-send-plane-fill"></i>
        </div>
      </div>
      <Modal
        isOpen={modalOpen}
        onRequestClose={closeModal}
        contentLabel="Patient Information Modal"
        className="modalll"
      >
        <h3 className='modalh3'>Patient Information</h3>
        <div className='patientinf'>
          <p>Name: {patientInfo?.name}</p>
          <p>Gender: {patientInfo?.gender}</p>
          <p>Age: {patientInfo?.age}</p>
          <p>Date of Birth: {patientInfo?.dob}</p>
          <p>Temperature: {patientInfo?.temperature}</p>
          <p>Pulse: {patientInfo?.pulse}</p>
          <p>Blood Pressure: {patientInfo?.bloodPressure}</p>
          <p>Height: {patientInfo?.height}</p>
          <p>Weight: {patientInfo?.weight}</p>
          <p>Condition: {patientInfo?.condition}</p>
          <p>Description: {patientInfo?.description}</p>
          <p>Symptoms: {patientInfo?.symptoms}</p>
          <p>Personal History: {patientInfo?.personalHistory}</p>
          <p>Family History: {patientInfo?.familyHistory}</p>
          <p>Allergies: {patientInfo?.allergies}</p>
          <p>Medications: {patientInfo?.medications}</p>
          <p>Reports: {patientInfo?.reports}</p>
          <p>Remarks: {patientInfo?.remarks}</p>
          <button className='modalbutton' onClick={closeModal}>Close</button>
        </div>
      </Modal>
    </div>
  );
};

export default PatientInfo;
