'use client';

import React, { useState, useEffect, type FormEvent } from 'react';
import type { DetectedFace, VisitorFormData } from '@/types/kiosk';
import { DEFAULT_INTERESTS } from '@/types/kiosk';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import RatingStars from '@/components/ui/RatingStars';
import TagPicker from '@/components/ui/TagPicker';

export interface VisitorFormModalProps {
  isOpen: boolean;
  face: DetectedFace | null;
  onSave: (data: VisitorFormData) => void;
  onClose: () => void;
}

const emptyFormData: VisitorFormData = {
  fullName: '',
  phone: '',
  email: '',
  company: '',
  interests: [],
  rating: 5,
};

export function VisitorFormModal({
  isOpen,
  face,
  onSave,
  onClose,
}: VisitorFormModalProps) {
  const [formData, setFormData] = useState<VisitorFormData>(emptyFormData);

  useEffect(() => {
    if (face) {
      if (face.matchedVisitor) {
        setFormData({
          fullName: face.matchedVisitor.fullName || '',
          phone: face.matchedVisitor.phone || '',
          email: face.matchedVisitor.email || '',
          company: face.matchedVisitor.company || '',
          interests: face.matchedVisitor.interests || [],
          rating: face.matchedVisitor.rating ?? 5,
        });
      } else {
        setFormData(emptyFormData);
      }
    }
  }, [face]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !face) {
    return null;
  }

  const title = face.matchedVisitor?.fullName
    ? face.matchedVisitor.fullName
    : 'Tag This Visitor';

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content Panel */}
      <div className="relative w-full max-w-lg bg-gray-900/95 backdrop-blur-xl rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto z-10 shadow-2xl border-t border-white/10 transform transition-transform duration-300 ease-out translate-y-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            {face.thumbnailUrl ? (
              <img
                src={face.thumbnailUrl}
                alt={title}
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-white/40 border-2 border-indigo-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white leading-tight">
                {title}
              </h3>
              <p className="text-xs text-white/60">
                {face.matchedVisitor
                  ? `Matched profile (${(face.matchedVisitor.similarity || 0).toFixed(3)} SFace score)`
                  : 'New visitor registration'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={(e: React.ChangeEvent<HTMLInputElement> | string) =>
              setFormData((prev) => ({
                ...prev,
                fullName: typeof e === 'string' ? e : e.target.value,
              }))
            }
            placeholder="Enter full name"
            required
          />

          <Input
            label="Phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement> | string) =>
              setFormData((prev) => ({
                ...prev,
                phone: typeof e === 'string' ? e : e.target.value,
              }))
            }
            placeholder="Enter phone number"
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement> | string) =>
              setFormData((prev) => ({
                ...prev,
                email: typeof e === 'string' ? e : e.target.value,
              }))
            }
            placeholder="Enter email address"
          />

          <Input
            label="Company"
            name="company"
            value={formData.company}
            onChange={(e: React.ChangeEvent<HTMLInputElement> | string) =>
              setFormData((prev) => ({
                ...prev,
                company: typeof e === 'string' ? e : e.target.value,
              }))
            }
            placeholder="Enter company name"
          />

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Interests
            </label>
            <TagPicker
              options={[...DEFAULT_INTERESTS]}
              selected={formData.interests}
              onChange={(interests: string[]) =>
                setFormData((prev) => ({ ...prev, interests }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Rating
            </label>
            <RatingStars
              value={formData.rating}
              onChange={(rating: number) =>
                setFormData((prev) => ({ ...prev, rating }))
              }
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 mt-2 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              Save Visitor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VisitorFormModal;
