import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const INIT = {
  design_ID: '', karat_ID: '', karat_Percent: '', design_Type_ID: '', gold_Colour_ID: '', size: '', weight: '', quantity: '',
  stone_ID: '', is_Colour_Required: false, colour_Stone_ID: '', colour_Stone: '', is_Certificate_Required: false,
  certificate_ID: '', diamond_Quality_ID: '', diamond_Weight: '', noOf_Diamonds: '', delivery_Date: '',
  orderType: 'new', specification: '', mode: 'A'
};

const NewOrder = () => {
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState({ frontImage: null, topImage: null, sideImage: null, backImage: null });
  const [existingImages, setExistingImages] = useState({ frontImage: '', topImage: '', sideImage: '', backImage: '' });
  const [loading, setLoading] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [designs, setDesigns] = useState([]);
  const [kts, setKts] = useState([]);
  const [types, setTypes] = useState([]);
  const [colours, setColours] = useState([]);
  const [stones, setStones] = useState([]);
  const [clrstones, setClrStones] = useState([]);
  const [certTypes, setCertTypes] = useState([]);
  const [quality, setQuality] = useState([]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
const BASE_URL = 'https://api.jewelquote.in';

  const searchParams = new URLSearchParams(location.search);
  const editParam = searchParams.get('edit');           // e.g. "10002"
  const isEdit = !!editParam && editParam !== 'false';  // true when a numeric ID is present
  const editOrderId = isEdit ? editParam : null;        // "10002"

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const load = async () => {
    try {
      const { data: order } = await api.get(BASE_URL+'/api/order/GetListCustomerOrder', { employee_ID: 0 });
      setDesigns(order.design);
      setKts(order.karat);
      setTypes(order.designType);
      setColours(order.goldColor);
      setStones(order.stones);
      setClrStones(order.clrStone);
      setCertTypes(order.certificate);
      setQuality(order.quality);
    } catch {}
  };

  const loadOrderForEdit = async (orderId) => {
    try {
      const { data} = await api.post(BASE_URL+'/api/order/GetOrderDetail', { order_ID: orderId ,mode:'C'} );
const o=data[0]
      setIsEditable(o.iS_Editable ?? false);

      setForm({
        design_ID:               o.design_ID              ?? '',
        karat_ID:                o.karat_ID               ?? '',
        karat_Percent:           o.karat_Percent          ?? '',
        design_Type_ID:          o.design_Type_ID         ?? '',
        gold_Colour_ID:          o.gold_Colour_ID         ?? '',
        size:                    o.size                   ?? '',
        weight:                  o.weight                 ?? '',
        quantity:                o.quantity               ?? '',
        stone_ID:                o.stone_ID               ?? '',
        is_Colour_Required:      o.is_Colour_Required     ?? false,
        colour_Stone_ID:         o.colour_Stone_ID        ?? '',
        colour_Stone:            o.colour_Stone           ?? '',
        is_Certificate_Required: o.is_Certificate_Required ?? false,
        certificate_ID:          o.cretificate_ID         ?? '',
        diamond_Quality_ID:      o.diamond_Quality_ID     ?? '',
        diamond_Weight:          o.diamond_Weight         ?? '',
        noOf_Diamonds:           o.noOf_Diamonds          ?? '',
        delivery_Date:           o.delivery_Date
                                   ? new Date(o.delivery_Date).toISOString().split('T')[0]
                                   : '',
        specification:           o.specification          ?? '',
        orderType:               'edit',
        mode:                    'E',
      });

      setExistingImages({
  frontImage: o.front_Image_URL ? BASE_URL+"/" + o.front_Image_URL : '',
  topImage: o.top_Image_URL ? BASE_URL +"/"+ o.top_Image_URL : '',
  sideImage: o.side_Image_URL ? BASE_URL +"/" +o.side_Image_URL : '',
  backImage: o.back_Image_URL ? BASE_URL+"/" + o.back_Image_URL : '',
});
    } catch (err) {
      toast.error('Failed to load order details');
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (isEdit && editOrderId) loadOrderForEdit(editOrderId);
  }, [isEdit, editOrderId]);

  const validate = () => {
    const e = {};
    if (!form.design_ID)      e.design_ID      = 'Design type is required';
    if (!form.karat_ID)       e.karat_ID       = 'KT is required';
    if (!form.design_Type_ID) e.design_Type_ID = 'Design Type is required';
    if (!form.gold_Colour_ID) e.gold_Colour_ID = 'Gold Colour is required';
    if (!form.stone_ID)       e.stone_ID       = 'Stone is required';
    if (!form.delivery_Date)  e.delivery_Date  = 'Delivery date is required';
    if (!form.quantity)       e.quantity       = 'Quantity is required';
    setErrors(e);

    const hasFrontImage = images.frontImage || existingImages.frontImage;
    if (!hasFrontImage) {
      toast.error('Front Image is required');
      return false;
    }

    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (isEdit && !isEditable) {
      toast.error('This order is not editable');
      return;
    }
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      Object.entries(images).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append('customer_ID', user.entity_ID);
      if (isEdit && editOrderId)
        { fd.append('order_ID', editOrderId)
          fd["Mode"]="M";
          fd.append("front_Image_URL",existingImages.frontImage);
          fd.append("top_Image_URL",existingImages.topImage);
          fd.append("side_Image_URL",existingImages.sideImage);
          fd.append("back_Image_URL",existingImages.backImage);
        };

      const { data } = await api.post(BASE_URL+'/api/order/SaveOrder', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.statusCode === 1) {
        toast.success(isEdit ? 'Order updated successfully' : 'Order placed successfully');
      } else {
        toast.error(data?.message || 'Error saving order');
        return;
      }
      navigate('/customer/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  const ImageUpload = ({ field, label }) => {
    const preview = images[field]
      ? URL.createObjectURL(images[field])
      : existingImages[field] || null;

    return (
      <div>
        <label className="form-label small fw-semibold">{label}</label>
        <input
          type="file"
          className="form-control form-control-sm"
          accept="image/*"
          disabled={isEdit && !isEditable}
          onChange={e => setImages(i => ({ ...i, [field]: e.target.files[0] }))}
        />
        {preview && (
          <img src={preview} alt={label} className="mt-1 rounded"
            style={{ width: 60, height: 60, objectFit: 'cover' }} />
        )}
      </div>
    );
  };

  const fieldDisabled = isEdit && !isEditable;

  return (
    <div>
      <h5 className="fw-bold mb-4">
        {isEdit ? 'Edit Order' : 'New Order'}
        {isEdit && !isEditable && (
          <span className="badge bg-warning text-dark ms-3 fs-6">Read Only</span>
        )}
      </h5>

      <form onSubmit={handleSubmit}>
        <input type="hidden" value={form['mode']} name="mode" />

        <div className="row g-3">

          {/* Design Specifications */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">Design Specifications</div>
              <div className="card-body">
                <div className="row g-3">

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Design *</label>
                    <select className={`form-select ${errors.design_ID ? 'is-invalid' : ''}`}
                      value={form.design_ID} onChange={e => set('design_ID', e.target.value)}
                      disabled={fieldDisabled}>
                      <option value="">Select Design</option>
                      {designs.map(d => <option key={d.value} value={d.value}>{d.text}</option>)}
                    </select>
                    {errors.design_ID && <div className="invalid-feedback">{errors.design_ID}</div>}
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">KT *</label>
                    <select className={`form-select ${errors.karat_ID ? 'is-invalid' : ''}`}
                      value={form.karat_ID}
                      onChange={e => { set('karat_ID', e.target.value); if (e.target.value !== '6') set('karat_Percent', ''); }}
                      disabled={fieldDisabled}>
                      <option value="">Select KT</option>
                      {kts.map(k => <option key={k.value} value={k.value}>{k.text}</option>)}
                    </select>
                    {errors.karat_ID && <div className="invalid-feedback">{errors.karat_ID}</div>}
                  </div>

                  {form.karat_ID === '6' && (
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Percent Value</label>
                      <input type="number" step="0.01" className="form-control"
                        value={form.karat_Percent} onChange={e => set('karat_Percent', e.target.value)}
                        disabled={fieldDisabled} />
                    </div>
                  )}

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Design Type *</label>
                    <select className={`form-select ${errors.design_Type_ID ? 'is-invalid' : ''}`}
                      value={form.design_Type_ID} onChange={e => set('design_Type_ID', e.target.value)}
                      disabled={fieldDisabled}>
                      <option value="">Select Type</option>
                      {types.map(t => <option key={t.value} value={t.value}>{t.text}</option>)}
                    </select>
                    {errors.design_Type_ID && <div className="invalid-feedback">{errors.design_Type_ID}</div>}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Gold Colour *</label>
                    <select className={`form-select ${errors.gold_Colour_ID ? 'is-invalid' : ''}`}
                      value={form.gold_Colour_ID} onChange={e => set('gold_Colour_ID', e.target.value)}
                      disabled={fieldDisabled}>
                      <option value="">Select Colour</option>
                      {colours.map(c => <option key={c.value} value={c.value}>{c.text}</option>)}
                    </select>
                    {errors.gold_Colour_ID && <div className="invalid-feedback">{errors.gold_Colour_ID}</div>}
                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Size</label>
                    <input className="form-control" value={form.size}
                      onChange={e => set('size', e.target.value)} disabled={fieldDisabled} />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Gold Weight</label>
                    <input type="number" step="0.001" className="form-control"
                      value={form.weight} onChange={e => set('weight', e.target.value)}
                      disabled={fieldDisabled} />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Quantity *</label>
                    <input className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                      value={form.quantity} onChange={e => set('quantity', e.target.value)}
                      disabled={fieldDisabled} />
                    {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Stone Details */}
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">Stone Details</div>
              <div className="card-body">
                <div className="row">

                  <div className="mb-1 col-md-6">
                    <label className="form-label fw-semibold">Stone *</label>
                    <select className={`form-select ${errors.stone_ID ? 'is-invalid' : ''}`}
                      value={form.stone_ID} onChange={e => set('stone_ID', e.target.value)}
                      disabled={fieldDisabled}>
                      <option value="">Select Stone</option>
                      {stones.map(s => <option key={s.value} value={s.value}>{s.text}</option>)}
                    </select>
                    {errors.stone_ID && <div className="invalid-feedback">{errors.stone_ID}</div>}
                  </div>

                  <div className="form-check mb-2 col-md-6">
                    <input className="form-check-input" type="checkbox" id="colourStone"
                      checked={form.is_Colour_Required}
                      onChange={e => set('is_Colour_Required', e.target.checked)}
                      disabled={fieldDisabled} />
                    <label className="form-check-label" htmlFor="colourStone">Colour Stone Required</label>

                    {form.is_Colour_Required && (
                      <>
                        <br />
                        <select className="form-select mb-2 col-md-6" style={{ marginTop: 10 }}
                          value={form.colour_Stone_ID}
                          onChange={e => { set('colour_Stone_ID', e.target.value); if (e.target.value !== '6') set('colour_Stone', ''); }}
                          disabled={fieldDisabled}>
                          <option value="">Select Colour Stone</option>
                          {clrstones.map(s => <option key={s.value} value={s.value}>{s.text}</option>)}
                        </select>
                      </>
                    )}
                  </div>

                  {form.is_Colour_Required && form.colour_Stone_ID === '3' && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Colour Stone Value</label>
                      <input type="number" step="0.01" className="form-control"
                        value={form.colour_Stone} onChange={e => set('colour_Stone', e.target.value)}
                        disabled={fieldDisabled} />
                    </div>
                  )}

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Diamond Quality</label>
                    <select className="form-select" value={form.diamond_Quality_ID}
                      onChange={e => set('diamond_Quality_ID', e.target.value)}
                      disabled={fieldDisabled}>
                      <option value="">Select Quality</option>
                      {quality.map(q => <option key={q.value} value={q.value}>{q.text}</option>)}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Diamond Weight</label>
                    <input className="form-control" value={form.diamond_Weight}
                      onChange={e => set('diamond_Weight', e.target.value)} disabled={fieldDisabled} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">No Of Diamonds</label>
                    <input className="form-control" value={form.noOf_Diamonds}
                      onChange={e => set('noOf_Diamonds', e.target.value)} disabled={fieldDisabled} />
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Certificate & Delivery */}
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">Certificate & Delivery</div>
              <div className="card-body">

                <div className="form-check mb-3">
                  <input className="form-check-input" type="checkbox" id="cert"
                    checked={form.is_Certificate_Required}
                    onChange={e => set('is_Certificate_Required', e.target.checked)}
                    disabled={fieldDisabled} />
                  <label className="form-check-label" htmlFor="cert">Certificate Required</label>
                </div>

                {form.is_Certificate_Required && (
                  <div className="mb-3">
                    <select className="form-select" value={form.certificate_ID}
                      onChange={e => set('certificate_ID', e.target.value)}
                      disabled={fieldDisabled}>
                      <option value="">Select Certificate Type</option>
                      {certTypes.map(c => <option key={c.value} value={c.value}>{c.text}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label fw-semibold">Delivery Date *</label>
                  <input type="date" className={`form-control ${errors.delivery_Date ? 'is-invalid' : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                    value={form.delivery_Date} onChange={e => set('delivery_Date', e.target.value)}
                    disabled={fieldDisabled} />
                  {errors.delivery_Date && <div className="invalid-feedback">{errors.delivery_Date}</div>}
                </div>

                <div className="mt-3">
                  <label className="form-label fw-semibold">Specifications</label>
                  <textarea className="form-control" rows={5} value={form.specification}
                    onChange={e => set('specification', e.target.value)} disabled={fieldDisabled} />
                </div>

              </div>
            </div>
          </div>

          {/* Reference Images */}
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

          {/* Action Buttons */}
          <div className="col-12">
            {(!isEdit || isEditable) && (
              <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />{isEdit ? 'Updating...' : 'Placing Order...'}</>
                  : isEdit ? 'Update Order' : 'Place Order'}
              </button>
            )}
            {isEdit && !isEditable && (
              <span className="badge bg-warning text-dark me-3 px-3 py-2 fs-6">
                This order is no longer editable
              </span>
            )}
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