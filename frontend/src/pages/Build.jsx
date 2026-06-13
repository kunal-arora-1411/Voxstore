import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShopForm from '../components/ShopForm';
import { StepDots } from '../components/ui';
import api from '../api/index';

export default function Build() {
  const [error, setError] = useState('');
  const [autoLoading, setAutoLoading] = useState(false);
  const navigate = useNavigate();

  function handleGenerate(formData) {
    setError('');
    navigate('/generating', { state: { formData } });
  }

  async function handleAutoGenerate({ shopName, tone, brandColor, pricingTier }) {
    setError('');
    setAutoLoading(true);
    try {
      const { data } = await api.post('/sites/autofill', { shopName, tone, brandColor, pricingTier });
      navigate('/generating', {
        state: {
          formData: {
            ...data,
            // Always honour the user's explicit visual choices — never let
            // the AI override the colour or pricing tier they selected.
            tone,
            brandColor,
            pricingTier,
            // Empty contact fields (not part of autofill)
            address: '',
            phone: '',
            email: '',
            website: '',
            instagram: '',
            facebook: '',
            logoImage: null,
            heroImage: null,
            shopPhotos: [],
            productPhotos: {},
          },
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not build the brand profile. Please try again.');
    } finally {
      setAutoLoading(false);
    }
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
            Enter only your shop name and let AI create the brand, content, logo and imagery,
            or add your own details for more control.
          </p>
        </div>

        {error && (
          <div className="build-error">{error}</div>
        )}

        <div className="build-form-wrap">
          <ShopForm
            onSubmit={handleGenerate}
            onAutoGenerate={handleAutoGenerate}
            loading={false}
            autoLoading={autoLoading}
          />
        </div>

      </div>
    </div>
  );
}
