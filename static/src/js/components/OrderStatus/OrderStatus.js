import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { FaChevronCircleRight } from 'react-icons/fa'

import EDSCIcon from '../EDSCIcon/EDSCIcon'
import OrderStatusList from './OrderStatusList'
import PortalLinkContainer from '../../containers/PortalLinkContainer/PortalLinkContainer'
import RelatedCollection from '../RelatedCollection/RelatedCollection'
import Skeleton from '../Skeleton/Skeleton'
import Well from '../Well/Well'

import { deployedEnvironment } from '../../../../../sharedUtils/deployedEnvironment'
import { getEnvironmentConfig } from '../../../../../sharedUtils/config'
import { locationPropType } from '../../util/propTypes/location'
import { orderStatusSkeleton, orderStatusLinksSkeleton } from './skeleton'
import { portalPath } from '../../../../../sharedUtils/portalPath'
import { stringify } from '../../util/url/url'

import './OrderStatus.scss'

export const OrderStatus = ({
  authToken,
  earthdataEnvironment,
  granuleDownload,
  location,
  match,
  onChangePath,
  onFetchRetrieval,
  onFetchRetrievalCollection,
  onFetchRetrievalCollectionGranuleLinks,
  onFocusedCollectionChange,
  onMetricsRelatedCollection,
  onToggleAboutCSDAModal,
  portal,
  retrieval = {}
}) => {
  useEffect(() => {
    if (authToken !== '') {
      const { params } = match
      const { id: retrievalId } = params

      onFetchRetrieval(retrievalId, authToken)
    }
  }, [authToken])

  const {
    collections,
    id,
    isLoaded,
    isLoading,
    jsondata = {},
    links = []
  } = retrieval

  const { byId = {} } = collections

  const [filteredRelatedCollectionItems, setFilteredRelatedCollections] = useState([])

  // Add all the related collections to an array and select a
  // random three to display in the ui
  useEffect(() => {
    const relatedCollectionItems = []

    if (!isLoading && isLoaded) {
      Object.values(byId).forEach((retrievalCollection) => {
        const { collection_metadata: metadata } = retrievalCollection

        const { relatedCollections } = metadata

        if (relatedCollections) {
          const { items = [] } = relatedCollections

          relatedCollectionItems.push(...items)
        }
      })

      setFilteredRelatedCollections(relatedCollectionItems
        .sort(() => 0.5 - Math.random()).slice(0, 3))
    }
  }, [isLoading, isLoaded])

  const { source } = jsondata

  let {
    download: downloads = [],
    opendap: opendapOrders = [],
    echo_orders: echoOrders = [],
    esi: esiOrders = [],
    harmony: harmonyOrders = []
  } = collections

  const collectionsById = Object.values(byId)

  downloads = collectionsById.filter(({ id }) => downloads.includes(id))
  opendapOrders = collectionsById.filter(({ id }) => opendapOrders.includes(id))
  echoOrders = collectionsById.filter(({ id }) => echoOrders.includes(id))
  esiOrders = collectionsById.filter(({ id }) => esiOrders.includes(id))
  harmonyOrders = collectionsById.filter(({ id }) => harmonyOrders.includes(id))

  const { edscHost } = getEnvironmentConfig()

  const eeLink = earthdataEnvironment === deployedEnvironment() ? '' : `?ee=${earthdataEnvironment}`

  const introduction = (
    <p>
      {'This page will automatically update as your orders are processed. The Download Status page can be accessed later by visiting '}
      <a href={`${edscHost}${portalPath(portal)}/downloads/${id}${eeLink}`}>
        {`${edscHost}${portalPath(portal)}/downloads/${id}${eeLink}`}
      </a>
      {' or the '}
      <PortalLinkContainer
        to={{
          pathname: '/downloads',
          search: stringify({ ee: earthdataEnvironment === deployedEnvironment() ? '' : earthdataEnvironment })
        }}
      >
        Download Status and History
      </PortalLinkContainer>
      {' page.'}
    </p>
  )

  const allCollections = [
    ...downloads,
    ...opendapOrders,
    ...echoOrders,
    ...esiOrders,
    ...harmonyOrders
  ]

  return (
    <div className="order-status">
      <Well className="order-status">
        <Well.Main>
          <Well.Heading>Download Status</Well.Heading>
          <Well.Introduction>{introduction}</Well.Introduction>
          {
            (isLoading && !isLoaded) && (
              <Skeleton
                className="order-status__item-skeleton"
                containerStyle={{ display: 'inline-block', height: '175px', width: '100%' }}
                shapes={orderStatusSkeleton}
              />
            )
          }
          {
            isLoaded && (
              <OrderStatusList
                collections={allCollections}
                earthdataEnvironment={earthdataEnvironment}
                granuleDownload={granuleDownload}
                match={match}
                onChangePath={onChangePath}
                onFetchRetrieval={onFetchRetrieval}
                onFetchRetrievalCollection={onFetchRetrievalCollection}
                onFetchRetrievalCollectionGranuleLinks={onFetchRetrievalCollectionGranuleLinks}
                onToggleAboutCSDAModal={onToggleAboutCSDAModal}
              />
            )
          }
          <Well.Heading>Additional Resources and Documentation</Well.Heading>
          <Well.Section>
            {
              isLoading && (
                <Skeleton
                  className="order-status__item-skeleton"
                  containerStyle={{ display: 'inline-block', height: '175px', width: '100%' }}
                  shapes={orderStatusLinksSkeleton}
                />
              )
            }
            {
              isLoaded && (
                <ul className="order-status__links">
                  {
                    (links && links.length > 0) && (
                      links.map((link, i) => {
                        const { dataset_id: datasetId, links } = link
                        return (
                          <li
                            // eslint-disable-next-line react/no-array-index-key
                            key={`${datasetId}_${i}`}
                            className="order-status__links-item"
                          >
                            <h3 className="order-status__links-title">{datasetId}</h3>
                            <ul className="order-status__collection-links">
                              {
                                links.map((link) => {
                                  const { href } = link
                                  return (
                                    <li
                                      key={href}
                                      className="order-status__collection-links-item"
                                    >
                                      <a
                                        href={href}
                                        className="order-status__collection-link"
                                      >
                                        {href}
                                      </a>
                                    </li>
                                  )
                                })
                              }
                            </ul>
                          </li>
                        )
                      })
                    )
                  }
                  {
                    (links && links.length === 0) && (
                      <li className="order-status__links-item">
                        No additional resources provided
                      </li>
                    )
                  }
                </ul>
              )
            }
          </Well.Section>
          {
            (isLoaded && (
              filteredRelatedCollectionItems && filteredRelatedCollectionItems.length > 0
            )) && (
              <>
                <Well.Heading>You might also be interested in...</Well.Heading>
                <Well.Section>
                  <ul className="order-status__links">
                    {
                      (
                        filteredRelatedCollectionItems.map((relatedCollection, i) => {
                          const { id } = relatedCollection

                          return (
                            <li
                              // eslint-disable-next-line react/no-array-index-key
                              key={`${id}_${i}`}
                              className="order-status__links-item"
                            >
                              <RelatedCollection
                                key={`related-collection-${id}`}
                                className="collection-body__related-collection-link"
                                location={location}
                                onFocusedCollectionChange={onFocusedCollectionChange}
                                onMetricsRelatedCollection={onMetricsRelatedCollection}
                                relatedCollection={relatedCollection}
                              />
                            </li>
                          )
                        })
                      )
                    }
                  </ul>
                </Well.Section>
              </>
            )
        }
        </Well.Main>
        <Well.Footer>
          <Well.Heading>Next Steps</Well.Heading>
          <ul className="order-status__footer-link-list">
            <li className="order-status__footer-link-item">
              <EDSCIcon icon={FaChevronCircleRight} className="order-status__footer-link-icon" />
              <PortalLinkContainer
                className="order-status__footer-link"
                to={{
                  pathname: '/search',
                  search: source
                }}
                onClick={() => { onChangePath(`/search${source}`) }}
              >
                Back to Earthdata Search Results
              </PortalLinkContainer>
            </li>
            <li className="order-status__footer-link-item">
              <EDSCIcon icon={FaChevronCircleRight} className="order-status__footer-link-icon" />
              <PortalLinkContainer
                className="order-status__footer-link"
                to={{
                  pathname: '/search',
                  search: stringify({ ee: earthdataEnvironment === deployedEnvironment() ? '' : earthdataEnvironment })
                }}
                onClick={() => { onChangePath('/search') }}
              >
                Start a New Earthdata Search Session
              </PortalLinkContainer>
            </li>
            <li className="order-status__footer-link-item">
              <EDSCIcon library="fa" icon={FaChevronCircleRight} className="order-status__footer-link-icon" />
              <PortalLinkContainer
                className="order-status__footer-link"
                to={{
                  pathname: '/downloads',
                  search: stringify({ ee: earthdataEnvironment === deployedEnvironment() ? '' : earthdataEnvironment })
                }}
              >
                View Your Download Status & History
              </PortalLinkContainer>
            </li>
          </ul>
        </Well.Footer>
      </Well>
    </div>
  )
}

OrderStatus.propTypes = {
  authToken: PropTypes.string.isRequired,
  earthdataEnvironment: PropTypes.string.isRequired,
  granuleDownload: PropTypes.shape({}).isRequired,
  location: locationPropType.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string
    })
  }).isRequired,
  onChangePath: PropTypes.func.isRequired,
  onFetchRetrieval: PropTypes.func.isRequired,
  onFetchRetrievalCollection: PropTypes.func.isRequired,
  onFetchRetrievalCollectionGranuleLinks: PropTypes.func.isRequired,
  onFocusedCollectionChange: PropTypes.func.isRequired,
  onMetricsRelatedCollection: PropTypes.func.isRequired,
  onToggleAboutCSDAModal: PropTypes.func.isRequired,
  portal: PropTypes.shape({}).isRequired,
  retrieval: PropTypes.shape({}).isRequired
}

export default OrderStatus
