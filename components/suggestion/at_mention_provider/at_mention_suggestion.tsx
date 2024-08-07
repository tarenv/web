// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode} from 'react';
import {FormattedMessage, injectIntl} from 'react-intl';

import {Constants} from 'utils/constants';
import * as Utils from 'utils/utils';
import {isGuest} from 'mattermost-redux/utils/user_utils';

import BotBadge from 'components/widgets/badges/bot_badge';
import GuestBadge from 'components/widgets/badges/guest_badge';
import SharedUserIndicator from 'components/shared_user_indicator';
import Avatar from 'components/widgets/users/avatar';

import Suggestion from '../suggestion.jsx';
import CustomStatusEmoji from 'components/custom_status/custom_status_emoji';
import StatusIcon from 'components/status_icon';

import {UserProfile} from '../command_provider/app_command_parser/app_command_parser_dependencies.js';

interface Item extends UserProfile {
    display_name: string;
    name: string;
    isCurrentUser: boolean;
    type: string;
}

class AtMentionSuggestion extends Suggestion {
    render() {
        const {intl} = this.props;
        const isSelection: boolean = this.props.isSelection;
        const item: Item = this.props.item;

        let itemname: string;
        let description: ReactNode;
        let icon: JSX.Element;
        let customStatus: ReactNode;
        if (item.username === 'all') {
            itemname = 'all';
            description = (
                <span className='ml-2'>
                    <FormattedMessage
                        id='suggestion.mention.all'
                        defaultMessage='Notifies everyone in this channel'
                    />
                </span>
            );
            icon = (
                <span className='suggestion-list__icon suggestion-list__icon--large'>
                    <i
                        className='icon icon-account-multiple-outline'
                        title={intl.formatMessage({id: 'generic_icons.member', defaultMessage: 'Member Icon'})}
                    />
                </span>
            );
        } else if (item.username === 'channel') {
            itemname = 'channel';
            description = (
                <span className='ml-2'>
                    <FormattedMessage
                        id='suggestion.mention.channel'
                        defaultMessage='Notifies everyone in this channel'
                    />
                </span>
            );
            icon = (
                <span className='suggestion-list__icon suggestion-list__icon--large'>
                    <i
                        className='icon icon-account-multiple-outline'
                        title={intl.formatMessage({id: 'generic_icons.member', defaultMessage: 'Member Icon'})}
                    />
                </span>
            );
        } else if (item.username === 'here') {
            itemname = 'here';
            description = (
                <span className='ml-2'>
                    <FormattedMessage
                        id='suggestion.mention.here'
                        defaultMessage='Notifies everyone online in this channel'
                    />
                </span>
            );
            icon = (
                <span className='suggestion-list__icon suggestion-list__icon--large'>
                    <i
                        className='icon icon-account-multiple-outline'
                        title={intl.formatMessage({id: 'generic_icons.member', defaultMessage: 'Member Icon'})}
                    />
                </span>
            );
        } else if (item.type === Constants.MENTION_GROUPS) {
            itemname = item.name;
            description = `- ${item.display_name}`;
            icon = (
                <span className='suggestion-list__icon suggestion-list__icon--large'>
                    <i
                        className='icon icon-account-multiple-outline'
                        title={intl.formatMessage({id: 'generic_icons.member', defaultMessage: 'Member Icon'})}
                    />
                </span>
            );
        } else {
            itemname = item.username;

            if (item.isCurrentUser) {
                if (item.first_name || item.last_name) {
                    description = (
                        <span className='ml-2'>
                            {Utils.getFullName(item)}
                        </span>
                    );
                }
            } else if (item.first_name || item.last_name || item.nickname) {
                description = (
                    <span className='ml-2'>
                        {`${Utils.getFullName(item)} ${
                            item.nickname ? `(${item.nickname})` : ''
                        }`.trim()}
                    </span>
                );
            }

            icon = (
                <span className='status-wrapper style--none'>
                    <span className='profile-icon'>
                        <Avatar
                            username={item && item.username}
                            size='sm'
                            url={Utils.imageURLForUser(item.id, item.last_picture_update)}
                        />
                    </span>
                    <StatusIcon status={item && item.status}/>
                </span>
            );

            customStatus = (
                <CustomStatusEmoji
                    showTooltip={true}
                    userID={item.id}
                    emojiSize={15}
                    emojiStyle={{
                        margin: '0 4px 4px',
                    }}
                />
            );
        }

        let youElement = null;
        if (item.isCurrentUser) {
            youElement =
            (<span className='ml-1'>
                <FormattedMessage
                    id='suggestion.user.isCurrent'
                    defaultMessage='(you)'
                />
            </span>);
        }

        let className = 'suggestion-list__item';
        if (isSelection) {
            className += ' suggestion--selected';
        }

        let sharedIcon;
        if (item.remote_id) {
            sharedIcon = (
                <SharedUserIndicator
                    className='shared-user-icon'
                    withTooltip={true}
                />
            );
        }

        return (
            <div
                className={className}
                data-testid={`mentionSuggestion_${itemname}`}
                onClick={this.handleClick}
                onMouseMove={this.handleMouseMove}
                {...Suggestion.baseProps}
            >
                {icon}
                <span className='suggestion-list__ellipsis'>
                    <span className='suggestion-list__main'>
                        {'@' + itemname}
                    </span>
                    <BotBadge
                        show={Boolean(item.is_bot)}
                        className='badge-autocomplete'
                    />
                    {customStatus}
                    {description}
                    {youElement}
                    {sharedIcon}
                    <GuestBadge
                        show={isGuest(item.roles)}
                        className='badge-autocomplete'
                    />
                </span>
            </div>
        );
    }
}

export default injectIntl(AtMentionSuggestion);
