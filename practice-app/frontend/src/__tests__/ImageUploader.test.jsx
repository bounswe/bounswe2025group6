import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUploader from '../components/ui/ImageUploader';

// Mock the useToast hook
jest.mock('../components/ui/Toast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  })
}));

// Mock FileReader
const mockFileReader = {
  onloadend: null,
  readAsDataURL: jest.fn(function() {
    setTimeout(() => {
      this.onloadend();
    }, 0);
  }),
  result: 'data:image/png;base64,mockedImageData'
};

window.FileReader = jest.fn(() => mockFileReader);

describe('ImageUploader Component', () => {
  const mockOnImageUpload = jest.fn().mockResolvedValue(true);
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders with placeholder when no current image is provided', () => {
    render(<ImageUploader onImageUpload={mockOnImageUpload} />);
    
    // Placeholder should be visible
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('Change photo')).toBeInTheDocument();
  });
  
  test('renders with current image when provided', () => {
    render(
      <ImageUploader 
        currentImage="https://example.com/current-image.jpg" 
        onImageUpload={mockOnImageUpload} 
      />
    );
    
    // Current image should be displayed
    const img = screen.getByAltText('Profile');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/current-image.jpg');
  });
  
  test('shows preview and action buttons when an image is selected', async () => {
    const { getByText, getByAltText } = render(
      <ImageUploader onImageUpload={mockOnImageUpload} />
    );
    
    // Create a mock file
    const file = new File(['(⌐□_□)'], 'test.png', { type: 'image/png' });
    
    // Find the file input and upload a file
    const input = screen.getByLabelText('Change photo');
    fireEvent.change(input, { target: { files: [file] } });
    
    // Wait for the preview to render
    await waitFor(() => {
      expect(getByAltText('Preview')).toBeInTheDocument();
    });
    
    // Should show the action buttons
    expect(getByText('Confirm')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });
  
  test('calls onImageUpload when confirming upload', async () => {
    const { getByText } = render(
      <ImageUploader onImageUpload={mockOnImageUpload} />
    );
    
    // Create a mock file
    const file = new File(['(⌐□_□)'], 'test.png', { type: 'image/png' });
    
    // Find the file input and upload a file
    const input = screen.getByLabelText('Change photo');
    fireEvent.change(input, { target: { files: [file] } });
    
    // Wait for the preview
    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
    });
    
    // Click confirm button
    fireEvent.click(getByText('Confirm'));
    
    // Check if onImageUpload was called with the file and preview
    expect(mockOnImageUpload).toHaveBeenCalledWith(
      file,
      'data:image/png;base64,mockedImageData'
    );
  });
  
  test('cancels upload when cancel button is clicked', async () => {
    const { getByText } = render(
      <ImageUploader onImageUpload={mockOnImageUpload} />
    );
    
    // Create a mock file
    const file = new File(['(⌐□_□)'], 'test.png', { type: 'image/png' });
    
    // Find the file input and upload a file
    const input = screen.getByLabelText('Change photo');
    fireEvent.change(input, { target: { files: [file] } });
    
    // Wait for the preview
    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
    });
    
    // Click cancel button
    fireEvent.click(getByText('Cancel'));
    
    // Should go back to initial state
    await waitFor(() => {
      expect(screen.getByText('Change photo')).toBeInTheDocument();
      expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
    });
  });
});
