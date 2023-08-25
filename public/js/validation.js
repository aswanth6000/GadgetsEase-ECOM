document.addEventListener('DOMContentLoaded', function() {
const form = document.getElementById('myForm');
const username = document.getElementById('name');
const phone = document.getElementById('phone_num');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');

form.addEventListener('submit', function(event) {
  let isValid = true;

  document.querySelectorAll('.error-message').forEach(element => {
    element.textContent = '';
  });

  if (!/^[a-zA-Z ]+$/.test(username.value)) {
    document.getElementById('name-error').textContent = 'Name should only contain letters and spaces';
    isValid = false;
  }


  if (!/^\d{10}$/.test(phone.value)) {
    document.getElementById('phone-error').textContent = 'Phone number should be 10 digits';
    isValid = false;
  }

  if (password.value.length < 8) {
    document.getElementById('password-error').textContent = 'Password should be at least 8 characters long';
    isValid = false;
  }

  if (password.value !== confirmPassword.value) {
    document.getElementById('confirmPassword-error').textContent = 'Passwords do not match';
    isValid = false;
  }

  if (!isValid) {
    event.preventDefault(); 
  }
})});