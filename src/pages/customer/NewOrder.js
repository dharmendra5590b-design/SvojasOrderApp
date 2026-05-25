import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DESIGNS = ['Ring', 'Necklace', 'Bracelet', 'Earring', 'Pendant', 'Bangle', 'Chain', 'Other'];
const KTS = ['14KT', '18KT', '22KT', '24KT'];
const TYPES = ['Plain Gold', 'Diamond', 'Gemstone', 'Mixed'];
const COLOURS = ['Yellow Gold', 'White Gold', 'Rose Gold', 'Two Tone'];
const STONES = ['Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Pearl', 'Other'];
const CERT_TYPES = ['GIA', 'IGI', 'HRD', 'SGL'];

const INIT = {
  design: '', kt: '', percentValue: '', type: '', goldColour: '', size: '', goldWeight: '',
  stone: '', colourStoneRequired: false, colourStone: '', certificateRequired: false,
  certificateType: '', diamondWeightRequired: false, deliveryDate: '',
  orderType: 'new'
};

const NewOrder = () => {
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState({ frontImage: null, topImage: null, sideImage: null, backImage: null });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.design) e.design = 'Design type is required';
    if (!form.kt) e.kt = 'KT is required';
    if (!form.deliveryDate) e.deliveryDate = 'Delivery date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      // customerId will be resolved in backend via logged-in user
      Object.entries(images).forEach(([k, v]) => { if (v) fd.append(k, v); });
      await api.post('/orders', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Order placed successfully!');
      navigate('/customer/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error placing order');
    } finally { setLoading(false); }
  };

  const ImageUpload = ({ field, label }) => (
    <div>
      <label className="form-label small fw-semibold">{label}</label>
      <input type="file" className="form-control form-control-sm" accept="image/*"
        onChange={e => setImages(i => ({ ...i, [field]: e.target.files[0] }))} />
      {images[field] && (
        <img src={URL.createObjectURL(images[field])} alt={label}
          className="mt-1 rounded" style={{ width: 60, height: 60, objectFit: 'cover' }} />
      )}
    </div>
  );

  return (
    <div>
      <h5 className="fw-bold mb-4">New Order</h5>
      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          {/* Design Specs */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">Design Specifications</div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Design *</label>
                    <select className={`form-select ${errors.design ? 'is-invalid' : ''}`}
                      value={form.design} onChange={e => set('design', e.target.value)}>
                      <option value="">Select Design</option>
                      {DESIGNS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    {errors.design && <div className="invalid-feedback">{errors.design}</div>}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">KT *</label>
                    <select className={`form-select ${errors.kt ? 'is-invalid' : ''}`}
                      value={form.kt} onChange={e => set('kt', e.target.value)}>
                      <option value="">Select KT</option>
                      {KTS.map(k => <option key={k}>{k}</option>)}
                    </select>
                    {errors.kt && <div className="invalid-feedback">{errors.kt}</div>}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Percent Value</label>
                    <input type="number" step="0.01" className="form-control"
                      value={form.percentValue} onChange={e => set('percentValue', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Type</label>
                    <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                      <option value="">Select Type</option>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Gold Colour</label>
                    <select className="form-select" value={form.goldColour} onChange={e => set('goldColour', e.target.value)}>
                      <option value="">Select Colour</option>
                      {COLOURS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Size</label>
                    <input className="form-control" value={form.size} onChange={e => set('size', e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Gold Weight</label>
                    <input type="number" step="0.001" className="form-control"
                      value={form.goldWeight} onChange={e => set('goldWeight', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stone & Certificate */}
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">Stone Details</div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Stone</label>
                  <select className="form-select" value={form.stone} onChange={e => set('stone', e.target.value)}>
                    <option value="">Select Stone</option>
                    {STONES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="colourStone"
                    checked={form.colourStoneRequired} onChange={e => set('colourStoneRequired', e.target.checked)} />
                  <label className="form-check-label" htmlFor="colourStone">Colour Stone Required</label>
                </div>
                {form.colourStoneRequired && (
                  <select className="form-select mb-2" value={form.colourStone} onChange={e => set('colourStone', e.target.value)}>
                    <option value="">Select Colour Stone</option>
                    {STONES.map(s => <option key={s}>{s}</option>)}
                  </select>
                )}
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="diamondWt"
                    checked={form.diamondWeightRequired} onChange={e => set('diamondWeightRequired', e.target.checked)} />
                  <label className="form-check-label" htmlFor="diamondWt">Diamond Weight Required</label>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">Certificate & Delivery</div>
              <div className="card-body">
                <div className="form-check mb-3">
                  <input className="form-check-input" type="checkbox" id="cert"
                    checked={form.certificateRequired} onChange={e => set('certificateRequired', e.target.checked)} />
                  <label className="form-check-label" htmlFor="cert">Certificate Required</label>
                </div>
                {form.certificateRequired && (
                  <div className="mb-3">
                    <select className="form-select" value={form.certificateType} onChange={e => set('certificateType', e.target.value)}>
                      <option value="">Select Certificate Type</option>
                      {CERT_TYPES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="form-label fw-semibold">Delivery Date *</label>
                  <input type="date" className={`form-control ${errors.deliveryDate ? 'is-invalid' : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                    value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
                  {errors.deliveryDate && <div className="invalid-feedback">{errors.deliveryDate}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">Reference Images</div>
              <div className="card-body">
                <div className="row g-3">
                  {['frontImage', 'topImage', 'sideImage', 'backImage'].map((f, i) => (
                    <div className="col-md-3" key={f}>
                      <ImageUpload field={f} label={['Front View', 'Top View', 'Side View', 'Back View'][i]} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Placing Order...</> : 'Place Order'}
            </button>
            <button type="button" className="btn btn-secondary ms-2 px-4" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewOrder;
