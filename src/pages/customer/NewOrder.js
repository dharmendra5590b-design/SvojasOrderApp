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
const [imgViewer,  setImgViewer]  = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const BASE_URL = 'https://localhost:8081';
// Image URL built from BASE_URL + relative path returned by API
  const imgUrl = url => url ? `${BASE_URL}/${url}` : null;
  const searchParams = new URLSearchParams(location.search);

  // --- mode detection ---
  const editParam              = searchParams.get('edit');                       // normal edit
  const repeatModParam         = searchParams.get('RepeatorderModification');    // repeat: all fields editable, save as new
  const passRepeatParam        = searchParams.get('PassRepeatOrder');            // repeat: only qty + delivery date editable, save as new

  const isEdit                 = !!editParam        && editParam        !== 'false';
  const isRepeatMod            = !!repeatModParam   && repeatModParam   !== 'false';
  const isPassRepeat           = !!passRepeatParam  && passRepeatParam  !== 'false';

  const editOrderId            = isEdit       ? editParam        : null;
  const repeatModOrderId       = isRepeatMod  ? repeatModParam   : null;
  const passRepeatOrderId      = isPassRepeat ? passRepeatParam  : null;

  // The order ID to load (whichever mode is active)
  const sourceOrderId          = editOrderId ?? repeatModOrderId ?? passRepeatOrderId ?? null;

  // --- field-level disable logic ---
  // isEdit   : respect IS_Editable flag (existing behaviour)
  // isRepeatMod : all fields enabled (bypass flag)
  // isPassRepeat: only quantity & delivery_Date enabled (bypass flag)
  const isRepeatMode           = isRepeatMod || isPassRepeat;   // saving as new order in both cases

  // For RepeatorderModification all fields are enabled, so fieldDisabled is always false.
  // For PassRepeatOrder every field except qty / delivery_Date is disabled.
  // For normal edit, original IS_Editable logic applies.
  const fieldDisabled = (() => {
    if (isRepeatMod)   return false;           // all editable
    if (isPassRepeat)  return true;            // base: disabled; overridden per-field below
    return isEdit && !isEditable;              // original behaviour
  })();

  // Extra helper: is a given field enabled in PassRepeatOrder mode?
  const passRepeatEnabled = (fieldName) =>
    isPassRepeat && (fieldName === 'quantity' || fieldName === 'delivery_Date');

  // Convenience: disabled state for a specific field
  const fd = (fieldName) => {
    if (passRepeatEnabled(fieldName)) return false;   // override for these two fields
    return fieldDisabled;
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const load = async () => {
    try {
      const { data: order } = await api.get(BASE_URL + '/api/order/GetListCustomerOrder', { employee_ID: 0 });
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

  const loadOrderForEdit = async (orderId, forRepeat = false) => {
    try {
      const { data } = await api.post(BASE_URL + '/api/order/GetOrderDetail', { order_ID: orderId, mode: 'C' });
      const o = data[0];

      // Only apply IS_Editable when doing a normal edit; repeat modes bypass it entirely.
      if (!forRepeat) setIsEditable(o.iS_Editable ?? false);

      setForm({
        design_ID:               o.design_ID              ?? '',
        karat_ID:                o.karat_ID?.toString()               ?? '',
        karat_Percent:           o.karat_Percent          ?? '',
        design_Type_ID:          o.design_Type_ID         ?? '',
        gold_Colour_ID:          o.gold_Colour_ID         ?? '',
        size:                    o.size                   ?? '',
        weight:                  o.weight                 ?? '',
        quantity:                o.quantity               ?? '',
        stone_ID:                o.stone_ID               ?? '',
        is_Colour_Required:      o.is_Colour_Required     ?? false,
        colour_Stone_ID:         o.colour_Stone_ID?.toString()        ?? '',
        colour_Stone:            o.colour_Stone           ?? '',
        is_Certificate_Required: o.is_Certificate_Required ?? false,
        certificate_ID:          o.cretificate_ID?.toString()         ?? '',
        diamond_Quality_ID:      o.diamond_Quality_ID     ?? '',
        diamond_Weight:          o.diamond_Weight         ?? '',
        noOf_Diamonds:           o.noOf_Diamonds          ?? '',
        delivery_Date:           o.delivery_Date
                                   ? new Date(o.delivery_Date).toLocaleDateString('en-CA')
                                   : '',
        specification:           o.specification          ?? '',
        // repeat modes always create a new order
        orderType: forRepeat ? 'new' : 'edit',
        mode:      forRepeat ? 'A'   : 'E',
        final_Gross_Weight:      o.final_Gross_Weight ?? '',
  final_Noof_Diamonds:     o.final_Noof_Diamonds ?? '',
  final_Diamond_Weight:    o.final_Diamond_Weight ?? '',
  noOfColour_Stone:        o.noOfColour_Stone ?? '',
  colourStone_Weight:      o.colourStone_Weight ?? '',
  others_NoOfColour_Stone: o.others_NoOfColour_Stone ?? '',
  others_Colour_Stone_Weight: o.others_Colour_Stone_Weight ?? '',
  final_Net_Weight:        o.final_Net_Weight ?? '',

  gold_Loss:               o.gold_Loss ?? '',
  labour_Charge:           o.labour_Charge ?? '',
  gold_Loss_24kt:          o.gold_Loss_24kt ?? '',
  bill_Amount:             o.bill_Amount ?? '',
  diamond_Value:o.diamond_Value,
  colour_Stone_Value:o.colour_Stone_Value,
  other_Colour_Stone_Value:o.other_Colour_Stone_Value,
  final_Net_Weight_24kt:o.final_Net_Weight_24kt,
  certificate_Charge:o.certificate_Charge,
  other_Charges:o.other_Charges,
  final_Gold_Weight_24kt:  o.final_Gold_Weight_24kt ?? '',
order_Complete_DT:o.order_Complete_DT,
caD_Image_URL:o.caD_Image_URL
      });

      setExistingImages({
        frontImage: o.front_Image_URL ? BASE_URL + '/' + o.front_Image_URL : '',
        topImage:   o.top_Image_URL   ? BASE_URL + '/' + o.top_Image_URL   : '',
        sideImage:  o.side_Image_URL  ? BASE_URL + '/' + o.side_Image_URL  : '',
        backImage:  o.back_Image_URL  ? BASE_URL + '/' + o.back_Image_URL  : '',
      });
    } catch (err) {
      toast.error('Failed to load order details');
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
  if (!sourceOrderId) {
    // No order to load (plain "New Order" navigation) — clear any
    // stale data left over from a previous edit/repeat view.
    setForm(INIT);
    setImages({ frontImage: null, topImage: null, sideImage: null, backImage: null });
    setExistingImages({ frontImage: '', topImage: '', sideImage: '', backImage: '' });
    setErrors({});
    setIsEditable(true);
    return;
  }
  // forRepeat = true skips IS_Editable and sets mode:'A' (new order)
  loadOrderForEdit(sourceOrderId, isRepeatMode);
}, [sourceOrderId, isRepeatMode]);
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

    // Normal edit: respect IS_Editable. Repeat modes: always allowed.
    if (isEdit && !isRepeatMode && !isEditable) {
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

      // Only append order_ID / Mode / existing image URLs for a true edit (not repeat modes)
      if (isEdit && !isRepeatMode && editOrderId) {
        fd.append('order_ID', editOrderId);
        fd['mode'] = 'M';
        fd.append('front_Image_URL', existingImages.frontImage);
        fd.append('top_Image_URL',   existingImages.topImage);
        fd.append('side_Image_URL',  existingImages.sideImage);
        fd.append('back_Image_URL',  existingImages.backImage);
      }

      // For repeat modes the existing image URLs are still sent so the backend
      // can copy/reference them when creating the new order.
      if (isRepeatMode) {
        fd.append('order_ID', isRepeatMod?repeatModOrderId:passRepeatOrderId);
        fd.append('reorder_Type',isRepeatMod?'WITHUPDATE':'WITHOUTUPDATE')
        fd.set('mode', 'R');
        fd.append('front_Image_URL', existingImages.frontImage);
        fd.append('top_Image_URL',   existingImages.topImage);
        fd.append('side_Image_URL',  existingImages.sideImage);
        fd.append('back_Image_URL',  existingImages.backImage);
      }

      const { data } = await api.post(BASE_URL + '/api/order/SaveOrder', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.statusCode === 1) {
        const msg = isEdit && !isRepeatMode
          ? 'Order updated successfully'
          : 'Order placed successfully';
        toast.success(msg);
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
const InfoRow = ({ label, value }) => (
  <div className="col-md-3 mb-2">
    <small className="d-block" style={{ fontSize: '0.875em', letterSpacing: '0.04em', textTransform: 'uppercase',fontWeight:600 }}>{label}</small>
    <div className="fw-semibold text-dark" style={{ fontSize: '0.875em' }}>{value ?? '—'}</div>
  </div>
);
const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: '0.875em', textTransform: 'uppercase', letterSpacing: '0.1em',
    color: '#6c757d', fontWeight: 600, marginBottom: 10, paddingBottom: 6,
    borderBottom: '1px solid #e9ecef',fontWeight:600
  }}>
    {children}
  </div>
);
  const ImageUpload = ({ field, label }) => {
    const preview = images[field]
      ? URL.createObjectURL(images[field])
      : existingImages[field] || null;

    // Images are editable in: new order, RepeatorderModification, or normal editable edit.
    // In PassRepeatOrder and non-editable normal edit they are locked.
    const imageDisabled = isPassRepeat || (isEdit && !isRepeatMode && !isEditable);

    return (
      <div>
        <label className="form-label small fw-semibold">{label}</label>
        <input
          type="file"
          className="form-control form-control-sm"
          accept="image/*"
          disabled={imageDisabled}
          onChange={e => setImages(i => ({ ...i, [field]: e.target.files[0] }))}
        />
        {preview && (
          <img src={preview} alt={label} className="mt-1 rounded"
            style={{ width: 60, height: 60, objectFit: 'cover',cursor: "zoom-in" }}  onClick={() => setImgViewer(preview)} />
        )}
      </div>
    );
  };

  // --- page title / badge ---
  const pageTitle = (() => {
    if (isRepeatMod)  return 'Repeat Order (Full Edit)';
    if (isPassRepeat) return 'Repeat Order (Qty & Date)';
    if (isEdit)       return 'Edit Order';
    return 'New Order';
  })();

  const showReadOnlyBadge =
    (isEdit && !isRepeatMode && !isEditable) ||
    isPassRepeat;   // most fields locked in PassRepeatOrder too

  return (
    <div>
      <h5 className="fw-bold mb-4">
        {pageTitle}
        {showReadOnlyBadge && (
          <span className="badge bg-warning text-dark ms-3 fs-6">
            {isPassRepeat ? 'Qty & Date Only' : 'Read Only'}
          </span>
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
                      disabled={fd('design_ID')}>
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
                      disabled={fd('karat_ID')}>
                      <option value="">Select KT</option>
                      {kts.map(k => <option key={k.value} value={k.value}>{k.text}</option>)}
                    </select>
                    {errors.karat_ID && <div className="invalid-feedback">{errors.karat_ID}</div>}
                  </div>

                  {form.karat_ID === '6' && (
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Percent Value</label>
                     <input
  type="number"
  step="0.01"
  min="0"
  max="100"
  className="form-control"
  value={form.karat_Percent}
  onChange={(e) => {
    const value = parseFloat(e.target.value);

    if (e.target.value === '') {
      set('karat_Percent', '');
    } else if (value <= 100) {
      set('karat_Percent', e.target.value);
    }
  }}
  disabled={fd('karat_Percent')}
/>
                    </div>
                  )}

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Design Type *</label>
                    <select className={`form-select ${errors.design_Type_ID ? 'is-invalid' : ''}`}
                      value={form.design_Type_ID} onChange={e => set('design_Type_ID', e.target.value)}
                      disabled={fd('design_Type_ID')}>
                      <option value="">Select Type</option>
                      {types.map(t => <option key={t.value} value={t.value}>{t.text}</option>)}
                    </select>
                    {errors.design_Type_ID && <div className="invalid-feedback">{errors.design_Type_ID}</div>}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Gold Colour *</label>
                    <select className={`form-select ${errors.gold_Colour_ID ? 'is-invalid' : ''}`}
                      value={form.gold_Colour_ID} onChange={e => set('gold_Colour_ID', e.target.value)}
                      disabled={fd('gold_Colour_ID')}>
                      <option value="">Select Colour</option>
                      {colours.map(c => <option key={c.value} value={c.value}>{c.text}</option>)}
                    </select>
                    {errors.gold_Colour_ID && <div className="invalid-feedback">{errors.gold_Colour_ID}</div>}
                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Size</label>
                    <input className="form-control" value={form.size}
                      onChange={e => set('size', e.target.value)} disabled={fd('size')} />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Gold Weight</label>
                    <input type="text" step="0.001" className="form-control"
                      value={form.weight} onChange={e => set('weight', e.target.value)}
                      disabled={fd('weight')} />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Quantity *</label>
                    <input className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                      value={form.quantity} onChange={e => set('quantity', e.target.value)}
                      disabled={fd('quantity')} />
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
                      disabled={fd('stone_ID')}>
                      <option value="">Select Stone</option>
                      {stones.map(s => <option key={s.value} value={s.value}>{s.text}</option>)}
                    </select>
                    {errors.stone_ID && <div className="invalid-feedback">{errors.stone_ID}</div>}
                  </div>

                  <div className="form-check mb-2 col-md-6">
                    <input className="form-check-input" type="checkbox" id="colourStone"
                      checked={form.is_Colour_Required}
                      onChange={e => set('is_Colour_Required', e.target.checked)}
                      disabled={fd('is_Colour_Required')} />
                    <label className="form-check-label" htmlFor="colourStone">Colour Stone Required</label>

                    {form.is_Colour_Required && (
                      <>
                        <br />
                        <select className="form-select mb-2 col-md-6" style={{ marginTop: 10 }}
                          value={form.colour_Stone_ID}
                          onChange={e => { set('colour_Stone_ID', e.target.value); if (e.target.value !== '6') set('colour_Stone', ''); }}
                          disabled={fd('colour_Stone_ID')}>
                          <option value="">Select Colour Stone</option>
                          {clrstones.map(s => <option key={s.value} value={s.value}>{s.text}</option>)}
                        </select>
                      </>
                    )}
                  </div>

                  {form.is_Colour_Required && form.colour_Stone_ID === '3' && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Colour Stone Value</label>
                      <input type="text" step="0.01" className="form-control"
                        value={form.colour_Stone} onChange={e => set('colour_Stone', e.target.value)}
                        disabled={fd('colour_Stone')} />
                    </div>
                  )}

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Diamond Quality</label>
                    <select className="form-select" value={form.diamond_Quality_ID}
                      onChange={e => set('diamond_Quality_ID', e.target.value)}
                      disabled={fd('diamond_Quality_ID')}>
                      <option value="">Select Quality</option>
                      {quality.map(q => <option key={q.value} value={q.value}>{q.text}</option>)}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Diamond Weight</label>
                    <input className="form-control" value={form.diamond_Weight}
                      onChange={e => set('diamond_Weight', e.target.value)} disabled={fd('diamond_Weight')} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">No Of Diamonds</label>
                    <input className="form-control" value={form.noOf_Diamonds}
                      onChange={e => set('noOf_Diamonds', e.target.value)} disabled={fd('noOf_Diamonds')} />
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
                    disabled={fd('is_Certificate_Required')} />
                  <label className="form-check-label" htmlFor="cert">Certificate Required</label>
                </div>

                {form.is_Certificate_Required && (
                  <div className="mb-3">
                    <select className="form-select" value={form.certificate_ID}
                      onChange={e => set('certificate_ID', e.target.value)}
                      disabled={fd('certificate_ID')}>
                      <option value="">Select Certificate Type</option>
                      {certTypes.map(c => <option key={c.value} value={c.value}>{c.text}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label fw-semibold">Expected Delivery Date *</label>
                  <input type="date" className={`form-control ${errors.delivery_Date ? 'is-invalid' : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                    value={form.delivery_Date} onChange={e => set('delivery_Date', e.target.value)}
                    disabled={fd('delivery_Date')} />
                  {errors.delivery_Date && <div className="invalid-feedback">{errors.delivery_Date}</div>}
                </div>

                <div className="mt-3">
                  <label className="form-label fw-semibold">Specifications</label>
                  <textarea className="form-control" rows={5} value={form.specification}
                    onChange={e => set('specification', e.target.value)} disabled={fd('specification')} />
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
         {form.caD_Image_URL && (
  <div className="card">
    <div className="card-header">CAD Image</div>

    <div className="card-body text-center">
      <img
        src={imgUrl(form.caD_Image_URL)}
        alt="CAD Design"
        className="img-fluid rounded shadow-sm"
        style={{
          maxHeight: "320px",
          border: "2px solid #7c3aed",
          cursor: "zoom-in",
        }}
        onClick={() => setImgViewer(imgUrl(form.caD_Image_URL))}
      />

      <div className="text-muted small mt-2">
        Click image to enlarge
      </div>
    </div>
  </div>
)}  
{/* Completion Details */}
              {(form.order_Complete_DT) && !isRepeatMod && !isPassRepeat && (
                 <div className="col-12">
            <div className="card">
              <div className="card-header">Completion Details</div>
              <div className="card-body">
                <div className="row g-3">
  <InfoRow label="Final Gross Weight" value={form.final_Gross_Weight} />
<InfoRow label="No. of Diamonds" value={form.final_Noof_Diamonds} />
<InfoRow label="Final Diamond Weight" value={form.final_Diamond_Weight} />
<InfoRow label="Diamond Value" value={form.diamond_Value} />

<InfoRow label="No. of Colour Stones" value={form.noOfColour_Stone} />
<InfoRow label="Colour Stone Weight" value={form.colourStone_Weight} />
<InfoRow label="Colour Stone Value" value={form.colour_Stone_Value} />
<InfoRow label="Other Colour Stones" value={form.others_NoOfColour_Stone} />

<InfoRow label="Other Colour Stone Weight" value={form.others_Colour_Stone_Weight} />
<InfoRow label="Other Colour Stone Value" value={form.other_Colour_Stone_Value} />
<InfoRow label="Final Net Weight" value={form.final_Net_Weight} />
<InfoRow label="Final Net Weight (24KT)" value={form.final_Net_Weight_24kt} />

<InfoRow label="Labour Charge" value={form.labour_Charge} />
<InfoRow label="Gold Loss" value={form.gold_Loss} />
<InfoRow label="Gold Loss (24KT)" value={form.gold_Loss_24kt} />

<InfoRow label="Certificate Charge" value={form.certificate_Charge} />
<InfoRow label="Other Charges" value={form.other_Charges} />
<InfoRow label="Bill Amount" value={form.bill_Amount} />
<InfoRow label="Final Gold Weight (24KT)" value={form.final_Gold_Weight_24kt} />
</div>
                </div>
                </div>
                </div>
              )}
          {/* Action Buttons */}
          <div className="col-12">
            {/* Show submit button unless it's a non-editable normal edit */}
            {(!isEdit || isRepeatMode || isEditable) && (
              <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />{isEdit && !isRepeatMode ? 'Updating...' : 'Placing Order...'}</>
                  : isEdit && !isRepeatMode ? 'Update Order' : 'Place Order'}
              </button>
            )}
            {isEdit && !isRepeatMode && !isEditable && (
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
       {/* Full-screen image viewer */}
      {imgViewer && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.9)', cursor: 'zoom-out' }}
          onClick={() => setImgViewer(null)}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <img src={imgViewer} alt="Full view" className="img-fluid rounded"
              style={{ maxHeight: '92vh', margin: 'auto', display: 'block' }} />
          </div>
        </div>
      )}
    
    </div>
  );
};

export default NewOrder;