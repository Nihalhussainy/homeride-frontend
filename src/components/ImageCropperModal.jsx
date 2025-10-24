import React from 'react';
import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; // Don't forget to import the styles
import Button from './Button.jsx';
import './RatingModal.css'; // We can reuse the modal overlay styles

// This function is used to create the initial crop selection
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function ImageCropperModal({ imageSrc, onClose, onCropComplete }) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);
  const aspect = 1; // 1 for a square aspect ratio

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  }

  const handleCrop = () => {
    if (!completedCrop || !imgRef.current) {
      alert('Please select an area to crop.');
      return;
    }
    onCropComplete(imgRef.current, completedCrop);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Crop Your Image</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            circularCrop={true} // Makes the crop selection circular
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageSrc}
              onLoad={onImageLoad}
              style={{ maxHeight: '70vh' }}
            />
          </ReactCrop>
        </div>
        <div className="modal-actions">
          <Button onClick={onClose} className="secondary">Cancel</Button>
          <Button onClick={handleCrop}>Crop & Upload</Button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropperModal;
