import React, {type ReactNode} from 'react';
import styles from './tokens.module.css';

/** Scoped visual shell for the pyramid daily series (nav/search stay global). */
export default function PyramidSeriesRoot({children}: {children: ReactNode}): ReactNode {
  return (
    <div className={styles.root} data-series="pyramid">
      {children}
    </div>
  );
}