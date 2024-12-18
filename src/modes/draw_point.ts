import { ModeInterface } from "./mode_interface.ts";
import * as CommonSelectors from "../lib/common_selectors.ts";
import * as Constants from "../constants.ts";
import { modes } from "../constants.ts";
import { ModeBase } from "./mode_base.ts";

export class DrawPoint extends ModeBase implements ModeInterface {
  onSetup(opts) {
    const point = this.newFeature({
      type: Constants.geojsonTypes.FEATURE as "Feature",
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.POINT as "Point",
        coordinates: [],
      },
    });

    this.addFeature(point);

    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POINT);

    this.setActionableState({
      trash: true,
    });

    return { point };
  }

  stopDrawingAndRemove(state) {
    this.deleteFeature([state.point.id], { silent: true });
    this.changeMode(modes.simple_select);
  }

  onClick(state, e) {
    this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    state.point.updateCoordinate("", e.lngLat.lng, e.lngLat.lat);
    this.fire(Constants.events.CREATE, {
      features: [state.point.toGeoJSON()],
    });
    this.changeMode(modes.simple_select, {
      featureIds: [state.point.id],
    });
  }

  onTap(state, e) {
    // Handle tap events the same way as click events
    this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    state.point.updateCoordinate("", e.lngLat.lng, e.lngLat.lat);
    this.fire(Constants.events.CREATE, {
      features: [state.point.toGeoJSON()],
    });
    this.changeMode(modes.simple_select, {
      featureIds: [state.point.id],
    });
  }

  onStop(state) {
    this.activateUIButton();
    
    if (!state.point.getCoordinate().length) {
      this.deleteFeature([state.point.id], { silent: true });
    }
  }

  toDisplayFeatures(state, geojson, display) {
    // Never render the point we're drawing
    const isActivePoint = geojson.properties.id === state.point.id;
    geojson.properties.active = isActivePoint
      ? Constants.activeStates.ACTIVE
      : Constants.activeStates.INACTIVE;
    if (!isActivePoint) return display(geojson);
  }

  onTrash(state) {
    this.stopDrawingAndRemove(state);
  }

  onKeyUp(state, e) {
    if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
      return this.stopDrawingAndRemove(state);
    }
  }
}

// For backwards compatibility with the existing mode system
export default DrawPoint;
