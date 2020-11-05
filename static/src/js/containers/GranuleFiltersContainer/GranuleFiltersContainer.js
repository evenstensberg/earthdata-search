import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withFormik } from 'formik'
import * as Yup from 'yup'

import actions from '../../actions'

import {
  dateOutsideRange,
  maxLessThanMin,
  minLessThanMax,
  nullableTemporal,
  nullableValue,
  startBeforeEnd
} from '../../util/validation'

import { getFocusedCollectionGranuleQuery } from '../../selectors/query'
import { getFocusedCollectionMetadata } from '../../selectors/collectionMetadata'

import GranuleFiltersActions
  from '../../components/GranuleFilters/GranuleFiltersActions'
import GranuleFiltersBody
  from '../../components/GranuleFilters/GranuleFiltersBody'
import GranuleFiltersForm
  from '../../components/GranuleFilters/GranuleFiltersForm'

const mapStateToProps = state => ({
  collectionMetadata: getFocusedCollectionMetadata(state),
  granuleQuery: getFocusedCollectionGranuleQuery(state),
  temporal: state.query.collection.temporal
})

const mapDispatchToProps = dispatch => ({
  onApplyGranuleFilters:
    (values, closePanel) => dispatch(
      actions.applyGranuleFilters(values, closePanel)
    )
})

/**
 * Renders GranuleFiltersContainer.
 * @param {Object} props - The props passed into the component.
 * @param {Object} props.collections - The collections.
 * @param {String} props.focusedCollection - The focused collection id.
 * @param {Object} props.temporal - The query temporal.
 * @param {Function} props.onApplyGranuleFilters - Callback function to apply the granule filters.
 * @param {Object} props.errors - Form errors provided by Formik.
 * @param {Function} props.handleBlur - Callback function provided by Formik.
 * @param {Function} props.handleChange - Callback function provided by Formik.
 * @param {Object} props.metadata - The focused collection metadata.
 * @param {Object} props.values - Form values provided by Formik.
 * @param {Function} props.setFieldValue - Callback function provided by Formik.
 * @param {Function} props.setFieldTouched - Callback function provided by Formik.
 * @param {Object} props.touched - Form state provided by Formik.
 */
export class GranuleFiltersContainer extends Component {
  constructor(props) {
    super(props)
    this.form = null
    this.onClearGranuleFilters = this.onClearGranuleFilters.bind(this)
  }

  onClearGranuleFilters() {
    const {
      onApplyGranuleFilters,
      handleReset,
      values
    } = this.props

    handleReset()
    // Set each of the values to an empty string to avoid wiping
    // out ALL granule filters (e.g. sort key)
    const emptyObject = {}
    Object.keys(values).forEach((key) => {
      emptyObject[key] = ''
    })

    onApplyGranuleFilters(emptyObject)
  }

  render() {
    const {
      collectionMetadata,
      errors,
      handleBlur,
      handleChange,
      handleSubmit,
      isValid,
      setFieldTouched,
      setFieldValue,
      touched,
      values
    } = this.props

    return (
      <>
        <GranuleFiltersBody
          granuleFiltersForm={(
            <GranuleFiltersForm
              collectionMetadata={collectionMetadata}
              values={values}
              touched={touched}
              errors={errors}
              handleChange={handleChange}
              handleBlur={handleBlur}
              setFieldValue={setFieldValue}
              setFieldTouched={setFieldTouched}
            />
          )}
        />
        <GranuleFiltersActions
          isValid={isValid}
          onApplyClick={handleSubmit}
          onClearClick={this.onClearGranuleFilters}
        />
      </>
    )
  }
}

const ValidationSchema = (props) => {
  const { temporal = {} } = props
  const { startDate = '', endDate = '' } = temporal

  const errors = {
    cloudCover: {
      invalidNumber: 'Enter a valid number',
      minMax: 'Value must be between 0.0 and 100.0',
      // eslint-disable-next-line no-template-curly-in-string
      minLessThanMax: '${path} should be less than Maximum',
      // eslint-disable-next-line no-template-curly-in-string
      maxGreaterThanMin: '${path} should be greater Minimum'
    },
    gridCoords: {
      required: 'Grid Coordinates are required when a Tiling System is selected'
    },
    orbitNumber: {
      invalidNumber: 'Enter a valid number',
      minMax: 'Value must greater than 0.0',
      // eslint-disable-next-line no-template-curly-in-string
      minLessThanMax: '${path} should be less than Maximum',
      // eslint-disable-next-line no-template-curly-in-string
      maxGreaterThanMin: '${path} should be greater Minimum'
    },
    equatorCrossingLongitude: {
      invalidNumber: 'Enter a valid number',
      minMax: 'Value must be between -180.0 and 180.0',
      // eslint-disable-next-line no-template-curly-in-string
      minLessThanMax: '${path} should be less than Maximum',
      // eslint-disable-next-line no-template-curly-in-string
      maxGreaterThanMin: '${path} should be greater Minimum'
    },
    equatorCrossingDate: {
      invalidStartDate: 'Enter a valid start date',
      invalidEndDate: 'Enter a valid end date',
      // eslint-disable-next-line no-template-curly-in-string
      outsideRange: '${path} is outside current temporal range',
      // eslint-disable-next-line no-template-curly-in-string
      startBeforeEnd: '${path} should be before End'
    },
    temporal: {
      invalidStartDate: 'Enter a valid start date',
      invalidEndDate: 'Enter a valid end date',
      // eslint-disable-next-line no-template-curly-in-string
      outsideRange: '${path} is outside current temporal range',
      // eslint-disable-next-line no-template-curly-in-string
      startBeforeEnd: '${path} should be before End'
    }
  }

  return Yup.object().shape({
    tilingSystem: Yup.string(),
    gridCoords: Yup.string()
      .when('tilingSystem', {
        is: tilingSystemValue => tilingSystemValue.length > 0,
        then: Yup.string().required(errors.gridCoords.required)
      }),
    cloudCover: Yup.object().shape({
      min: Yup.number()
        .label('Minimum')
        .typeError(errors.cloudCover.invalidNumber)
        .test('min-less-than-max', errors.cloudCover.minLessThanMax, minLessThanMax)
        .min(0, errors.cloudCover.minMax)
        .max(100, errors.cloudCover.minMax)
        .transform(nullableValue)
        .nullable(),
      max: Yup.number()
        .label('Maximum')
        .typeError(errors.cloudCover.invalidNumber)
        .test('max-less-than-min', errors.cloudCover.maxGreaterThanMin, maxLessThanMin)
        .min(0, errors.cloudCover.minMax)
        .max(100, errors.cloudCover.minMax)
        .transform(nullableValue)
        .nullable()
    }),
    orbitNumber: Yup.object().shape({
      min: Yup.number()
        .label('Minimum')
        .typeError(errors.orbitNumber.invalidNumber)
        .test('min-less-than-max', errors.orbitNumber.minLessThanMax, minLessThanMax)
        .min(0, errors.orbitNumber.minMax)
        .transform(nullableValue)
        .nullable(),
      max: Yup.number()
        .label('Maximum')
        .typeError(errors.orbitNumber.invalidNumber)
        .test('max-less-than-min', errors.orbitNumber.maxGreaterThanMin, maxLessThanMin)
        .min(0, errors.orbitNumber.minMax)
        .transform(nullableValue)
        .nullable()
    }),
    equatorCrossingLongitude: Yup.object().shape({
      min: Yup.number()
        .label('Minimum')
        .typeError(errors.equatorCrossingLongitude.invalidNumber)
        .test('min-less-than-max', errors.equatorCrossingLongitude.minLessThanMax, minLessThanMax)
        .min(-180, errors.equatorCrossingLongitude.minMax)
        .max(180, errors.equatorCrossingLongitude.minMax)
        .transform(nullableValue)
        .nullable(),
      max: Yup.number()
        .label('Maximum')
        .typeError(errors.equatorCrossingLongitude.invalidNumber)
        .test('max-less-than-min', errors.equatorCrossingLongitude.maxGreaterThanMin, maxLessThanMin)
        .min(-180, errors.equatorCrossingLongitude.minMax)
        .max(180, errors.equatorCrossingLongitude.minMax)
        .transform(nullableValue)
        .nullable()
    }),
    equatorCrossingDate: Yup.object().shape({
      startDate: Yup.date()
        .label('Start')
        .typeError(errors.equatorCrossingDate.invalidStartDate)
        .transform(nullableValue)
        .nullable()
        .test('start-before-end', errors.equatorCrossingDate.startBeforeEnd, startBeforeEnd)

        .test('inside-global-equatorial-crossing-date', errors.equatorCrossingDate.outsideRange, value => dateOutsideRange(value, startDate, endDate)),
      endDate: Yup.date()
        .label('End')
        .typeError(errors.equatorCrossingDate.invalidEndDate)
        .transform(nullableValue)
        .nullable()
        .test('inside-global-equatorial-crossing-date', errors.equatorCrossingDate.outsideRange, value => dateOutsideRange(value, startDate, endDate))
    }),
    temporal: Yup.object().shape({
      startDate: Yup.date()
        .label('Start')
        .typeError(errors.temporal.invalidStartDate)
        .transform(nullableTemporal)
        .nullable()
        .test('start-before-end', errors.temporal.startBeforeEnd, startBeforeEnd)

        .test('inside-global-temporal', errors.temporal.outsideRange, value => dateOutsideRange(value, startDate, endDate)),
      endDate: Yup.date()
        .label('End')
        .typeError(errors.temporal.invalidEndDate)
        .transform(nullableTemporal)
        .nullable()
        .test('inside-global-temporal', errors.temporal.outsideRange, value => dateOutsideRange(value, startDate, endDate))
    })
  })
}

const EnhancedGranuleFiltersContainer = withFormik({
  enableReinitialize: true,
  validationSchema: ValidationSchema,
  mapPropsToValues: (props) => {
    const {
      granuleQuery
    } = props

    const {
      browseOnly = false,
      cloudCover = {},
      dayNightFlag = '',
      equatorCrossingDate = {},
      equatorCrossingLongitude = {},
      gridCoords = '',
      onlineOnly = false,
      orbitNumber = {},
      temporal = {},
      tilingSystem = ''
    } = granuleQuery

    const {
      min: cloudCoverMin,
      max: cloudCoverMax
    } = cloudCover

    const {
      min: orbitNumberMin = '',
      max: orbitNumberMax = ''
    } = orbitNumber

    const {
      min: equatorCrossingLongitudeMin = '',
      max: equatorCrossingLongitudeMax = ''
    } = equatorCrossingLongitude

    const {
      startDate: equatorCrossingDateStart = '',
      endDate: equatorCrossingDateEnd = ''
    } = equatorCrossingDate

    const {
      startDate: temporalStartDate,
      endDate: temporalEndDate,
      recurringDayStart: temporalRecurringDayStart = '',
      recurringDayEnd: temporalRecurringDayEnd = '',
      isRecurring: temporalIsRecurring = false
    } = temporal

    return {
      gridCoords: gridCoords || '',
      tilingSystem: tilingSystem || '',
      dayNightFlag: dayNightFlag || '',
      browseOnly: browseOnly || false,
      onlineOnly: onlineOnly || false,
      cloudCover: {
        min: cloudCoverMin || '',
        max: cloudCoverMax || ''
      },
      orbitNumber: {
        min: orbitNumberMin || '',
        max: orbitNumberMax || ''
      },
      equatorCrossingLongitude: {
        min: equatorCrossingLongitudeMin || '',
        max: equatorCrossingLongitudeMax || ''
      },
      equatorCrossingDate: {
        startDate: equatorCrossingDateStart || '',
        endDate: equatorCrossingDateEnd || ''
      },
      temporal: {
        startDate: temporalStartDate || '',
        endDate: temporalEndDate || '',
        recurringDayStart: temporalRecurringDayStart || '',
        recurringDayEnd: temporalRecurringDayEnd || '',
        isRecurring: temporalIsRecurring || false
      }
    }
  },
  handleSubmit: (values, { props, setSubmitting }) => {
    const {
      onApplyGranuleFilters
    } = props

    onApplyGranuleFilters(values, true)

    setSubmitting(false)
  }
})(GranuleFiltersContainer)

GranuleFiltersContainer.propTypes = {
  collectionMetadata: PropTypes.shape({}).isRequired,
  granuleQuery: PropTypes.shape({}).isRequired,
  errors: PropTypes.shape({}).isRequired,
  handleBlur: PropTypes.func.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleReset: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  isValid: PropTypes.bool.isRequired,
  onApplyGranuleFilters: PropTypes.func.isRequired,
  setFieldTouched: PropTypes.func.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  touched: PropTypes.shape({}).isRequired,
  values: PropTypes.shape({}).isRequired
}

export default connect(mapStateToProps, mapDispatchToProps)(EnhancedGranuleFiltersContainer)