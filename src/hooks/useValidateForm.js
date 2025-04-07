
import { useState } from 'react';
export const useValidateForm = (formDetails, setErrors) => {

    let isValid = true;
    const newErrors = {};
    const { firstName, lastName, email, password, confirmPassword, phoneNumber, address, birthDate } = formDetails;
    const validateForm = () => {
      // Validate first name
      if ('firstName' in formDetails && !formDetails.firstName.trim()) {
        newErrors.firstName = 'First name is required';
        isValid = false;
      }
  
      // Validate last name
      if ('lastName' in formDetails && !formDetails.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
        isValid = false;
      }
  
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (
        'email' in formDetails &&
        (!formDetails.email.trim() || !emailRegex.test(formDetails.email))
      ) {
        newErrors.email = 'Valid email is required';
        isValid = false;
      }
  
      // Validate password
      if ('password' in formDetails && formDetails.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
        isValid = false;
      }
  
      // Validate password confirmation
      if (
        'password' in formDetails &&
        'confirmPassword' in formDetails &&
        formDetails.password !== formDetails.confirmPassword
      ) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
  
      // Validate phone number
      const phoneRegex = /^\d{10}$/;
      if (
        'phoneNumber' in formDetails &&
        (!formDetails.phoneNumber.trim() ||
          !phoneRegex.test(formDetails.phoneNumber.replace(/[^0-9]/g, '')))
      ) {
        newErrors.phoneNumber = 'Valid 10-digit phone number is required';
        isValid = false;
      }
  
      // Validate address
      if ('address' in formDetails && !formDetails.address.trim()) {
        newErrors.address = 'Address is required';
        isValid = false;
      }
  
      setErrors(newErrors);
      return isValid;
    };
  
    return { validateForm };
  };
