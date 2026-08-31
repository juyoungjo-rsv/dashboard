// Pure presentational avatar built from layered emoji + CSS shapes, so no
// image assets are needed for the customization system to feel real.
export default function CharacterAvatar({ avatar, size = 'normal' }) {
  const body = avatar?.body?.color || '#cde8d8';
  const face = avatar?.face?.emoji || '⌒ ⌒';
  const hat = avatar?.hat?.emoji || '';
  const accessory = avatar?.accessory?.emoji || '';
  const outfit = avatar?.outfit?.color || '#e0e0e0';

  return (
    <div className={`avatar-wrap${size === 'small' ? ' small' : ''}`}>
      <div className="avatar-body" style={{ background: body }}>
        <span className="avatar-face">{face}</span>
      </div>
      {hat && <div className="avatar-hat">{hat}</div>}
      {accessory && <div className="avatar-accessory">{accessory}</div>}
      <div className="avatar-outfit" style={{ background: outfit }} />
    </div>
  );
}
