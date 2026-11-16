import React, {type ReactNode} from 'react';
import styles from './tokens.module.css';

export default function CollapsiblePanel({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}): ReactNode {
  return (
    <details className={styles.details} {...(defaultOpen ? {open: true} : {})}>
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}