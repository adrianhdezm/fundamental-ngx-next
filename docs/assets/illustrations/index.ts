/*
 * SAP illustrations from @ui5/webcomponents-fiori, Copyright (c) SAP SE or an SAP affiliate company.
 * SPDX-License-Identifier: Apache-2.0
 * Used by the stories only; apps bring their own illustrations.
 */
import dialogNoMail from './sapIllus-Dialog-NoMail.svg?raw';
import dialogUnableToLoad from './sapIllus-Dialog-UnableToLoad.svg?raw';
import dotNoMail from './sapIllus-Dot-NoMail.svg?raw';
import dotUnableToLoad from './sapIllus-Dot-UnableToLoad.svg?raw';
import sceneNoMail from './sapIllus-Scene-NoMail.svg?raw';
import sceneUnableToLoad from './sapIllus-Scene-UnableToLoad.svg?raw';
import spotNoMail from './sapIllus-Spot-NoMail.svg?raw';
import spotUnableToLoad from './sapIllus-Spot-UnableToLoad.svg?raw';

const config = (name: string, files: Record<'scene' | 'dialog' | 'spot' | 'dot', string>) => ({
    scene: { id: `sapIllus-Scene-${name}`, file: files.scene },
    dialog: { id: `sapIllus-Dialog-${name}`, file: files.dialog },
    spot: { id: `sapIllus-Spot-${name}`, file: files.spot },
    dot: { id: `sapIllus-Dot-${name}`, file: files.dot }
});

export const NO_MAIL = config('NoMail', { scene: sceneNoMail, dialog: dialogNoMail, spot: spotNoMail, dot: dotNoMail });
export const UNABLE_TO_LOAD = config('UnableToLoad', {
    scene: sceneUnableToLoad,
    dialog: dialogUnableToLoad,
    spot: spotUnableToLoad,
    dot: dotUnableToLoad
});
