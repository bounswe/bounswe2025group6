// src/components/ui/ImageUploader.jsx

import React, { useState } from 'react';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import '../../styles/ImageUploader.css';

const ImageUploader = ({ currentImage, onImageUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await onImageUpload(selectedFile, preview);
      setSelectedFile(null);
      setPreview(null);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className="image-uploader-container">
      {preview ? (
        <div className="preview-wrapper">
          <div className="profile-image-preview">
            <img src={preview} alt="Preview" />
          </div>
          <div className="image-uploader-actions">
            <Button size="sm" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Confirm'}
            </Button>
            <Button size="sm" variant="secondary" onClick={handleCancel} disabled={isUploading}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="preview-wrapper">
          <div className="profile-image-preview">
            {currentImage ? (
              <img src={currentImage} alt="Profile" />
            ) : (
              <div className="placeholder-icon">?</div>
            )}
          </div>
          <label className="change-photo-label">
            Change photo
            <input type="file" accept="image/*" className="hidden-input" onChange={handleFileChange} />
          </label>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;