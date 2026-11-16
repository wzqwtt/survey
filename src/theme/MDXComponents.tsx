import React, {type ComponentProps} from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import MDXHeading from '@theme/MDXComponents/Heading';
import DocMeta from '@site/src/components/DocMeta';
import ZoomableImage from '@site/src/components/ZoomableImage';
import PyramidSeriesRoot from '@site/src/components/pyramid-series/PyramidSeriesRoot';
import LessonChrome from '@site/src/components/pyramid-series/LessonChrome';
import CourseRoadmap from '@site/src/components/pyramid-series/CourseRoadmap';
import LessonHero from '@site/src/components/pyramid-series/LessonHero';
import PyramidDiagram from '@site/src/components/pyramid-series/PyramidDiagram';
import CaseCompare from '@site/src/components/pyramid-series/CaseCompare';
import MicroExercise from '@site/src/components/pyramid-series/MicroExercise';
import CollapsiblePanel from '@site/src/components/pyramid-series/CollapsiblePanel';
import ReviewPrompt from '@site/src/components/pyramid-series/ReviewPrompt';
import SeriesCatalog from '@site/src/components/pyramid-series/SeriesCatalog';

export default {
  ...MDXComponents,
  img: ZoomableImage,
  PyramidSeriesRoot,
  LessonChrome,
  CourseRoadmap,
  LessonHero,
  PyramidDiagram,
  CaseCompare,
  MicroExercise,
  CollapsiblePanel,
  ReviewPrompt,
  SeriesCatalog,
  h1: (props: ComponentProps<'h1'>) => (
    <>
      <MDXHeading as="h1" {...props} />
      <DocMeta />
    </>
  ),
};
