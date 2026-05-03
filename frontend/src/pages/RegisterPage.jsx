import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { registerUser } from '../lib/api';

const initialErrors = { email: '', password: '' };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState(initialErrors);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setErrorMessage('');
    setSuccessMessage('');
  }

  function validate() {
    const nextErrors = { ...initialErrors };

    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    if (!form.password) nextErrors.password = 'Password is required.';
    else if (form.password.length < 6)
      nextErrors.password = 'Password must be at least 6 characters.';

    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await registerUser({
        email: form.email.trim(),
        password: form.password,
      });

      setSuccessMessage(response.message || 'Account created successfully. Redirecting...');
      setTimeout(() => navigate('/login', { replace: true }), 800);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthForm
      title="Register"
      description="Create your account and start organizing applications in one place."
      submitLabel="Register"
      onSubmit={handleSubmit}
      error={errorMessage}
      success={successMessage}
      isSubmitting={isSubmitting}
      fields={[
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          value: form.email,
          onChange: handleChange,
          placeholder: 'you@example.com',
          autoComplete: 'email',
          error: errors.email,
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          value: form.password,
          onChange: handleChange,
          placeholder: 'Create a secure password',
          autoComplete: 'new-password',
          error: errors.password,
        },
      ]}
      footer={
        <p className="auth-form__footer">
          Already have an account? <Link to="/login">Login instead</Link>
        </p>
      }
    />
  );
}
