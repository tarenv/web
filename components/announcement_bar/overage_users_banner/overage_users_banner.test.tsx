// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {fireEvent, screen} from '@testing-library/react';

import {DeepPartial} from '@mattermost/types/utilities';
import {GlobalState} from 'types/store';
import {General} from 'mattermost-redux/constants';
import {OverActiveUserLimits, Preferences, StatTypes} from 'utils/constants';
import {renderWithIntlAndStore} from 'tests/react_testing_utils';
import {savePreferences} from 'mattermost-redux/actions/preferences';
import {TestHelper} from 'utils/test_helper';
import {generateId} from 'utils/utils';

import OverageUsersBanner from './index';

type ComponentProps = React.ComponentProps<typeof OverageUsersBanner>;

type RenderComponentArgs = {
    props?: Partial<ComponentProps>;
    store?: any;
}

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: jest.fn().mockReturnValue(() => {}),
}));

jest.mock('mattermost-redux/actions/preferences', () => ({
    savePreferences: jest.fn(),
}));

const seatsPurchased = 40;
const email = 'test@mattermost.com';

const seatsMinimumFor5PercentageState = (Math.ceil(seatsPurchased * OverActiveUserLimits.MIN)) + seatsPurchased;

const seatsMinimumFor10PercentageState = (Math.ceil(seatsPurchased * OverActiveUserLimits.MAX)) + seatsPurchased;

const text5PercentageState = `Your workspace user count has exceeded your paid license seat count by ${seatsMinimumFor5PercentageState - seatsPurchased} seats. Purchase additional seats to remain compliant.`;
const text10PercentageState = `Your workspace user count has exceeded your paid license seat count by ${seatsMinimumFor10PercentageState - seatsPurchased} seats. Purchase additional seats to remain compliant.`;

const contactSalesTextLink = 'Contact Sales';

const licenseId = generateId();

describe('components/overage_users_banner', () => {
    const initialState: DeepPartial<GlobalState> = {
        views: {
            announcementBar: {
                announcementBarState: {
                    announcementBarCount: 1,
                },
            },
        },
        entities: {
            users: {
                currentUserId: 'current_user',
                profiles: {
                    current_user: {
                        roles: General.SYSTEM_ADMIN_ROLE,
                        id: 'currentUser',
                        email,
                    },
                },
            },
            admin: {
                analytics: {
                    [StatTypes.TOTAL_USERS]: 1,
                },
            },
            general: {
                license: {
                    IsLicensed: 'true',
                    IssuedAt: '1517714643650',
                    StartsAt: '1517714643650',
                    ExpiresAt: '1620335443650',
                    SkuShortName: 'Enterprise',
                    Name: 'LicenseName',
                    Company: 'Mattermost Inc.',
                    Users: String(seatsPurchased),
                    Email: 'test@mattermost.com',
                    Id: licenseId,
                },
            },
            preferences: {
                myPreferences: {},
            },
        },
    };

    let windowSpy: jest.SpyInstance;

    beforeAll(() => {
        windowSpy = jest.spyOn(window, 'open');
        windowSpy.mockImplementation(() => {});
    });

    afterAll(() => {
        windowSpy.mockRestore();
    });

    const renderComponent = ({store}: RenderComponentArgs = {props: {}, store: initialState}) => {
        return renderWithIntlAndStore(
            <OverageUsersBanner/>, store);
    };

    it('should not render the banner because we are not on overage state', () => {
        renderComponent();

        expect(screen.queryByText('Your workspace user count has exceeded your paid license seat count by', {exact: false})).not.toBeInTheDocument();
    });

    it('should not render the banner because we are not admins', () => {
        const store: GlobalState = JSON.parse(JSON.stringify(initialState));

        store.entities.users = {
            ...store.entities.users,
            profiles: {
                ...store.entities.users.profiles,
                current_user: {
                    ...store.entities.users.profiles.current_user,
                    roles: General.SYSTEM_USER_ROLE,
                },
            },
        };

        renderComponent({
            store,
        });

        expect(screen.queryByText('Your workspace user count has exceeded your paid license seat count by', {exact: false})).not.toBeInTheDocument();
    });

    it('should not render the banner because it\'s cloud licenese', () => {
        const store: GlobalState = JSON.parse(JSON.stringify(initialState));

        store.entities.general.license = {
            ...store.entities.general.license,
            Cloud: 'true',
        };

        renderComponent({
            store,
        });

        expect(screen.queryByText('Your workspace user count has exceeded your paid license seat count by', {exact: false})).not.toBeInTheDocument();
    });

    it('should not render the 5% banner because we have dissmised it', () => {
        const store: GlobalState = JSON.parse(JSON.stringify(initialState));

        store.entities.preferences.myPreferences = TestHelper.getPreferencesMock(
            [
                {
                    category: Preferences.OVERAGE_USERS_BANNER,
                    value: 'Overage users banner watched',
                    name: `warn_overage_seats_${licenseId.substring(0, 8)}`,
                },
            ],
        );

        store.entities.admin = {
            ...store.entities.admin,
            analytics: {
                [StatTypes.TOTAL_USERS]: seatsMinimumFor5PercentageState,
            },
        };

        renderComponent({
            store,
        });

        expect(screen.queryByText(text5PercentageState)).not.toBeInTheDocument();
    });

    it('should render the banner because we are over 5% and we don\'t have any preferences', () => {
        const store: GlobalState = JSON.parse(JSON.stringify(initialState));

        store.entities.admin = {
            ...store.entities.admin,
            analytics: {
                [StatTypes.TOTAL_USERS]: seatsMinimumFor5PercentageState,
            },
        };

        renderComponent({
            store,
        });

        expect(screen.getByText(text5PercentageState)).toBeInTheDocument();
        expect(screen.getByText(contactSalesTextLink)).toBeInTheDocument();
    });

    it('should render the banner because we are over 5% and we have preferences from one old banner', () => {
        const store: GlobalState = JSON.parse(JSON.stringify(initialState));

        store.entities.preferences.myPreferences = TestHelper.getPreferencesMock(
            [
                {
                    category: Preferences.OVERAGE_USERS_BANNER,
                    value: 'Overage users banner watched',
                    name: `warn_overage_seats_${10}`,
                },
            ],
        );

        store.entities.admin = {
            ...store.entities.admin,
            analytics: {
                [StatTypes.TOTAL_USERS]: seatsMinimumFor5PercentageState,
            },
        };

        renderComponent({
            store,
        });

        expect(screen.getByText(text5PercentageState)).toBeInTheDocument();
        expect(screen.getByText(contactSalesTextLink)).toBeInTheDocument();
    });

    it('should save the preferences for 5% banner if admin click on close', () => {
        const store: GlobalState = JSON.parse(JSON.stringify(initialState));

        store.entities.admin = {
            ...store.entities.admin,
            analytics: {
                [StatTypes.TOTAL_USERS]: seatsMinimumFor5PercentageState,
            },
        };

        renderComponent({
            store,
        });

        fireEvent.click(screen.getByRole('link'));

        expect(savePreferences).toBeCalledTimes(1);
        expect(savePreferences).toBeCalledWith(store.entities.users.profiles.current_user.id, [{
            category: Preferences.OVERAGE_USERS_BANNER,
            name: `warn_overage_seats_${licenseId.substring(0, 8)}`,
            user_id: store.entities.users.profiles.current_user.id,
            value: 'Overage users banner watched',
        }]);
    });

    it('should render the banner because we are over 10%', () => {
        const store: GlobalState = JSON.parse(JSON.stringify(initialState));

        store.entities.admin = {
            ...store.entities.admin,
            analytics: {
                [StatTypes.TOTAL_USERS]: seatsMinimumFor10PercentageState,
            },
        };

        renderComponent({
            store,
        });

        expect(screen.getByText(text10PercentageState)).toBeInTheDocument();
        expect(screen.getByText(contactSalesTextLink)).toBeInTheDocument();
    });
});
