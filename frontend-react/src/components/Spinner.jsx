import styles from './Spinner.module.css';
const Spinner = ({ size = 20 }) => (
  <span className={styles.spinner} style={{ width: size, height: size }} />
);
export default Spinner;
