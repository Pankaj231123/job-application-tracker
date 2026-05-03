import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { loginUser } from '../lib/api';

const initialErrors = { email: '', password: '' };

export default function LoginPage() {
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

    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      if (response.token) {
        localStorage.setItem('job-tracker-token', response.token);
      }
      if (response.user) {
        localStorage.setItem('job-tracker-user', JSON.stringify(response.user));
      }

      setSuccessMessage(response.message || 'Login successful. Redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthForm
      title="Login"
      description="Use your account credentials to access the tracker dashboard."
      submitLabel="Login"
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
          placeholder: 'Enter your password',
          autoComplete: 'current-password',
          error: errors.password,
        },
      ]}
      footer={
        <p className="auth-form__footer">
          New here? <Link to="/register">Register an account</Link>
        </p>
      }
    />
  );
}
