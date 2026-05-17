import styles from './Badge.module.css';
const colorMap = {
  admin: 'purple', researcher: 'teal',
  private: 'red', shared: 'orange', public: 'green',
  active: 'green', inactive: 'red',
  info: 'purple', warn: 'orange', error: 'red',
};
const Badge = ({ value }) => (
  <span className={`${styles.badge} ${styles[colorMap[value] || 'purple']}`}>
    {value}
  </span>
);
export default Badge;
