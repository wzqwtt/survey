import React, {type ComponentProps} from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import MDXHeading from '@theme/MDXComponents/Heading';
import DocMeta from '@site/src/components/DocMeta';

export default {
  ...MDXComponents,
  h1: (props: ComponentProps<'h1'>) => (
    <>
      <MDXHeading as="h1" {...props} />
      <DocMeta />
    </>
  ),
};
