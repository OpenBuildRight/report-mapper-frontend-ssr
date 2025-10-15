import {
  createElementObject,
  createPathComponent,
  extendContext,
} from "@react-leaflet/core";
import L from "leaflet";
import type { ReactNode } from "react";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

interface MarkerClusterGroupProps extends L.MarkerClusterGroupOptions {
  children: ReactNode;
}

function getPropsAndEvents(props: MarkerClusterGroupProps) {
  let clusterProps: Partial<L.MarkerClusterGroupOptions> = {};
  let clusterEvents: Record<string, any> = {};

  const { children, ...rest } = props;

  // Splitting props and events to different objects
  Object.entries(rest).forEach(([propName, prop]) => {
    if (propName.startsWith("on")) {
      clusterEvents = { ...clusterEvents, [propName]: prop };
    } else {
      clusterProps = { ...clusterProps, [propName]: prop };
    }
  });

  return { clusterProps, clusterEvents };
}

function createMarkerClusterGroup(
  props: MarkerClusterGroupProps,
  context: any,
) {
  const { clusterProps, clusterEvents } = getPropsAndEvents(props);
  const markerClusterGroup = new L.MarkerClusterGroup(clusterProps);

  Object.entries(clusterEvents).forEach(([eventAsProp, callback]) => {
    const clusterEvent = `cluster${eventAsProp.substring(2).toLowerCase()}`;
    markerClusterGroup.on(clusterEvent, callback);
  });

  return createElementObject(
    markerClusterGroup,
    extendContext(context, { layerContainer: markerClusterGroup }),
  );
}

const updateMarkerCluster = (
  instance: L.MarkerClusterGroup,
  props: MarkerClusterGroupProps,
  prevProps: MarkerClusterGroupProps,
) => {
  // TODO: when prop changes, update instance
};

const MarkerClusterGroup = createPathComponent(
  createMarkerClusterGroup,
  updateMarkerCluster,
);

export default MarkerClusterGroup;
