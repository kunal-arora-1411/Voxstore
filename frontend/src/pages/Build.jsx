import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShopForm from '../components/ShopForm';
import { StepDots } from '../components/ui';

export default function Build() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleGenerate(formData) {
    setError('');
    navigate('/generating', { state: { formData } });
  }

  return (
    <div className="build-page">
      <div className="build-inner">

        <div className="build-steps">
          <StepDots step={1} />
        </div>

        <div className="build-headline">
          <h1 className="build-h1 serif">Tell us about your shop.</h1>
          <p className="build-sub">
            The more detail you give us, the better the result. Two crisp sentences
            beat a long, vague description every time.
          </p>
        </div>

        {error && (
          <div className="build-error">{error}</div>
        )}

        <div className="build-form-wrap">
          <ShopForm onSubmit={handleGenerate} loading={false} />
        </div>

      </div>
    </div>
  );
}
