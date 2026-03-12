import { toDenseArray } from "./lib/to_dense_array.ts";
import { StringSet } from "./lib/string_set.ts";
import { render } from "./render.ts";
import * as Constants from "./constants.ts";
import type { DrawContext } from "./context.ts";
import type { Feat } from "./feature_types/feature.ts";

export class DrawStore {
  private _features: { [key: string]: Feat };
  private _featureIds: StringSet;
  private _selectedFeatureIds: StringSet;
  private _selectedCoordinates: any[];
  private _changedFeatureIds: StringSet;
  private _emitSelectionChange: boolean;
  private _mapInitialConfig: { [key: string]: any };
  private ctx: DrawContext;
  public isDirty: boolean;
  public sources: { hot: any[]; cold: any[] };
  public render: () => void;

  constructor(ctx: DrawContext) {
    this._features = {};
    this._featureIds = new StringSet();
    this._selectedFeatureIds = new StringSet();
    this._selectedCoordinates = [];
    this._changedFeatureIds = new StringSet();
    this._emitSelectionChange = false;
    this._mapInitialConfig = {};
    this.ctx = ctx;
    this.sources = {
      hot: [],
      cold: [],
    };
    this.isDirty = false;

    // Deduplicate requests to render and tie them to animation frames.
    let renderRequest: number | null;
    this.render = () => {
      if (!renderRequest) {
        renderRequest = requestAnimationFrame(() => {
          renderRequest = null;
          render(this);

          // Fire deduplicated selection change event
          if (this._emitSelectionChange) {
            this.ctx.events?.fire(Constants.events.SELECTION_CHANGE, {
              features: this.getSelected().map((feature) =>
                feature?.toGeoJSON()
              ),
              points: this.getSelectedCoordinates().map((coordinate) => ({
                type: Constants.geojsonTypes.FEATURE,
                properties: {},
                geometry: {
                  type: Constants.geojsonTypes.POINT,
                  coordinates: coordinate.coordinates,
                },
              })),
            });

            this._emitSelectionChange = false;
          }

          // Fire render event
          this.ctx.events?.fire(Constants.events.RENDER, {});
        });
      }
    };
  }

  createRenderBatch(): () => void {
    const holdRender = this.render;
    let numRenders = 0;
    this.render = function () {
      numRenders++;
    };

    return () => {
      this.render = holdRender;
      if (numRenders > 0) {
        this.render();
      }
    };
  }

  setDirty(): DrawStore {
    this.isDirty = true;
    return this;
  }

  featureChanged(featureId: string|number): DrawStore {
    this._changedFeatureIds.add(featureId);
    return this;
  }

  getChangedIds(): (string | number)[] {
    return this._changedFeatureIds.values();
  }

  clearChangedIds(): DrawStore {
    this._changedFeatureIds.clear();
    return this;
  }

  getAllIds(): (string | number)[] {
    return this._featureIds.values();
  }

  add(feature: Feat): DrawStore {
    this.featureChanged(feature.id);
    this._features[feature.id] = feature;
    this._featureIds.add(feature.id);
    return this;
  }

  delete(
  featureIds: string|number | (string|number)[],
    options: { silent?: boolean } = {},
  ): DrawStore {
    const deletedFeaturesToEmit: any[] = [];
    toDenseArray(featureIds).forEach((id) => {
      if (!this._featureIds.has(id)) return;
      this._featureIds.delete(id);
      this._selectedFeatureIds.delete(id);
      if (!options.silent) {
        if (deletedFeaturesToEmit.indexOf(this._features[id]) === -1) {
          deletedFeaturesToEmit.push(this._features[id].toGeoJSON());
        }
      }
      delete this._features[id];
      this.isDirty = true;
    });

    if (deletedFeaturesToEmit.length) {
      this.ctx.events?.fire(Constants.events.DELETE, {
        features: deletedFeaturesToEmit,
      });
    }

    this.refreshSelectedCoordinates(options);
    return this;
  }

  get(id: string|number): Feat | undefined {
    return this._features[id];
  }

  getAll(): Feat[] {
    return Object.keys(this._features).map((id) => this._features[id]);
  }

  select(
    featureIds: string | number| (number | string)[],
    options: { silent?: boolean } = {},
  ): DrawStore {
    toDenseArray(featureIds).forEach((id) => {
      if (this._selectedFeatureIds.has(id)) return;
      this._selectedFeatureIds.add(id);
      this._changedFeatureIds.add(id);
      if (!options.silent) {
        this._emitSelectionChange = true;
      }
    });
    return this;
  }

  deselect(
    featureIds: string |  (string | number)[],
    options: { silent?: boolean } = {},
  ): DrawStore {
    toDenseArray(featureIds).forEach((id) => {
      if (!this._selectedFeatureIds.has(id)) return;
      this._selectedFeatureIds.delete(id);
      this._changedFeatureIds.add(id);
      if (!options.silent) {
        this._emitSelectionChange = true;
      }
    });
    this.refreshSelectedCoordinates(options);
    return this;
  }

  clearSelected(options: { silent?: boolean } = {}): DrawStore {
    this.deselect(this._selectedFeatureIds.values(), {
      silent: options.silent,
    });
    return this;
  }

  setSelected(
    featureIds: string| number | (string|number)[] | undefined,
    options: { silent?: boolean } = {},
  ): DrawStore {
    featureIds = toDenseArray(featureIds);

    this.deselect(
      this._selectedFeatureIds
        .values()
        .filter((id) => featureIds.indexOf(id.toString()) === -1),
      { silent: options.silent },
    );

    this.select(
      featureIds.filter((id) => !this._selectedFeatureIds.has(id)),
      { silent: options.silent },
    );

    return this;
  }

  setSelectedCoordinates(
    coordinates: Array<{ coord_path: string; feature_id: string }>,
  ): DrawStore {
    this._selectedCoordinates = coordinates;
    this._emitSelectionChange = true;
    return this;
  }

  clearSelectedCoordinates(): DrawStore {
    this._selectedCoordinates = [];
    this._emitSelectionChange = true;
    return this;
  }

  getSelectedIds(): (string | number)[] {
    return this._selectedFeatureIds.values();
  }

  getSelected(): Feat[] {
    return this.getSelectedIds().map((id) => this.get(id.toString())).filter(feat=>!!feat);
  }

  getSelectedCoordinates(): { coordinates: any[] }[] {
    return this._selectedCoordinates.map((coordinate) => {
      const feature = this.get(coordinate.feature_id);
      return {
        coordinates: feature!.getCoordinate!(coordinate.coord_path),
      };
    });
  }

  isSelected(featureId: string): boolean {
    return this._selectedFeatureIds.has(featureId);
  }

  setFeatureProperty(featureId: string, property: string, value: any) {
    this.get(featureId)?.setProperty(property, value);
    this.featureChanged(featureId);
  }

  private refreshSelectedCoordinates(options: { silent?: boolean }) {
    const newSelectedCoordinates = this._selectedCoordinates.filter((point) =>
      this._selectedFeatureIds.has(point.feature_id)
    );
    if (
      this._selectedCoordinates.length !== newSelectedCoordinates.length &&
      !options.silent
    ) {
      this._emitSelectionChange = true;
    }
    this._selectedCoordinates = newSelectedCoordinates;
  }

  storeMapConfig() {
    Constants.interactions.forEach((interaction) => {
		if (!this.ctx.map) return

      const interactionSet = (this.ctx.map as any)[interaction];
      if (interactionSet) {
        this._mapInitialConfig[interaction] = (this.ctx.map as any)[interaction]
          .isEnabled();
      }
    });
  }

  restoreMapConfig() {
    Object.keys(this._mapInitialConfig).forEach((key) => {
      const value = this._mapInitialConfig[key];
	  if (!this.ctx.map) return
      if (value ) {
		    (this.ctx.map as any)[key].enable();
      } else {
        (this.ctx.map as any)[key].disable();
      }
    });
  }

  getInitialConfigValue(interaction: string): boolean {
    if (interaction in this._mapInitialConfig) {
      return this._mapInitialConfig[interaction];
    } else {
      return true;
    }
  }
}
