import React, {
  Children,
  FunctionComponent,
  ReactElement,
  ReactNode,
  useState,
  Fragment,
} from 'react';
import { darken } from 'polished';
import { styled } from '@storybook/theming';
import { logger } from '@storybook/client-logger';

import { getBlockBackgroundStyle } from './BlockBackgroundStyles';
import { Source, SourceProps } from './Source';
import { ActionBar, ActionItem } from '../ActionBar/ActionBar';
import { Toolbar } from './Toolbar';
import { ZoomContext } from './ZoomContext';

export interface PreviewProps {
  isColumn?: boolean;
  columns?: number;
  withSource?: SourceProps;
  isExpanded?: boolean;
  withToolbar?: boolean;
  className?: string;
}

const ChildrenContainer = styled.div<PreviewProps & { zoom: number }>(
  ({ isColumn, columns }) => ({
    display: isColumn || !columns ? 'block' : 'flex',
    position: 'relative',
    flexWrap: 'wrap',
    padding: '30px 20px',
    overflow: 'auto',
    flexDirection: isColumn ? 'column' : 'row',
    margin: -10,

    '& > *': isColumn
      ? {
          border: '10px solid transparent!important',
          width: '100%',
          display: 'block',
        }
      : {
          border: '10px solid transparent!important',
          maxWidth: '100%',
          display: 'inline-block',
        },
  }),
  ({ zoom }) => ({
    '> *': {
      zoom: 1 / zoom,
    },
  }),
  ({ columns }) =>
    columns && columns > 1 ? { '> *': { minWidth: `calc(100% / ${columns} - 20px)` } } : {}
);

const StyledSource = styled(Source)<{}>(({ theme }) => ({
  margin: 0,
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  borderBottomLeftRadius: theme.appBorderRadius,
  borderBottomRightRadius: theme.appBorderRadius,
  border: 'none',

  background:
    theme.base === 'light' ? 'rgba(0, 0, 0, 0.85)' : darken(0.05, theme.background.content),
  color: theme.color.lightest,
  button: {
    background:
      theme.base === 'light' ? 'rgba(0, 0, 0, 0.85)' : darken(0.05, theme.background.content),
  },
}));

const PreviewContainer = styled.div<PreviewProps>(
  ({ theme, withSource, isExpanded }) => ({
    position: 'relative',
    overflow: 'hidden',
    margin: '25px 0 40px',
    ...getBlockBackgroundStyle(theme),
    borderBottomLeftRadius: withSource && isExpanded && 0,
    borderBottomRightRadius: withSource && isExpanded && 0,
    borderBottomWidth: isExpanded && 0,
  }),
  ({ withToolbar }) => withToolbar && { paddingTop: 40 }
);

interface SourceItem {
  source?: ReactElement;
  actionItem: ActionItem;
}

const getSource = (
  withSource: SourceProps,
  expanded: boolean,
  setExpanded: Function
): SourceItem => {
  switch (true) {
    case !!(withSource && withSource.error): {
      return {
        source: null,
        actionItem: {
          title: 'No code available',
          disabled: true,
          onClick: () => setExpanded(false),
        },
      };
    }
    case expanded: {
      return {
        source: <StyledSource {...withSource} dark />,
        actionItem: { title: 'Hide code', onClick: () => setExpanded(false) },
      };
    }
    default: {
      return {
        source: null,
        actionItem: { title: 'Show code', onClick: () => setExpanded(true) },
      };
    }
  }
};
function getStoryId(children: ReactNode) {
  if (Children.count(children) === 1) {
    const elt = children as ReactElement;
    if (elt.props) {
      return elt.props.id;
    }
  }
  return null;
}

const PositionedToolbar = styled(Toolbar)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 40,
});

const Relative = styled.div({
  overflow: 'hidden',
  position: 'relative',
});

/**
 * A preview component for showing one or more component `Story`
 * items. The preview also shows the source for the component
 * as a drop-down.
 */
const Preview: FunctionComponent<PreviewProps> = ({
  isColumn,
  columns,
  children,
  withSource,
  withToolbar = false,
  isExpanded = false,
  className,
  ...props
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const { source, actionItem } = getSource(withSource, expanded, setExpanded);
  const [scale, setScale] = useState(1);
  const previewClasses = className ? `${className} sbdocs sbdocs-preview` : 'sbdocs sbdocs-preview';

  if (withToolbar && Array.isArray(children)) {
    logger.warn('Cannot use toolbar with multiple preview children, disabling');
  }
  const showToolbar = withToolbar && !Array.isArray(children);

  return (
    <PreviewContainer
      {...{ withSource, withToolbar: showToolbar }}
      {...props}
      className={previewClasses}
    >
      {showToolbar && (
        <PositionedToolbar
          border
          zoom={(z) => setScale(scale * z)}
          resetZoom={() => setScale(1)}
          storyId={getStoryId(children)}
          baseUrl="./iframe.html"
        />
      )}
      <ZoomContext.Provider value={{ scale }}>
        <Relative>
          <ChildrenContainer isColumn={isColumn} columns={columns} zoom={scale}>
            {Array.isArray(children) ? (
              // eslint-disable-next-line react/no-array-index-key
              children.map((child, i) => <div key={i}>{child}</div>)
            ) : (
              <div>{children}</div>
            )}
          </ChildrenContainer>
          {withSource && <ActionBar actionItems={[actionItem]} />}
        </Relative>
      </ZoomContext.Provider>
      {withSource && source}
    </PreviewContainer>
  );
};

export { Preview };
