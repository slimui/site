import React, { Component } from 'react'
import {
  Box,
  Container,
  Card,
  Flex,
  Input,
  colors
} from '@hackclub/design-system'
import { Submit } from 'components/Forms'
import { withFormik } from 'formik'
import { isEmpty } from 'lodash'
import Composer, { LS_NAME_KEY, LS_BODY_KEY } from './Composer'
import Invert from 'components/Invert'
import yup from 'yup'
import api from 'api'

const Sheet = Container.withComponent(Card).extend`
  transition: box-shadow 0.25s ease-out;
  &:hover {
    box-shadow: ${props => props.theme.boxShadows[2]};
  }

  .DraftEditor-editorContainer > div {
    min-height: 4rem;
  }

  .public-DraftEditorPlaceholder-inner {
    color: ${props => props.theme.colors.muted};
    font-size: ${props => props.theme.fontSizes[2]}px;
  }
`

const Header = Flex.extend`
  border-bottom: 1px solid ${props => props.theme.colors.smoke};

  input {
    border: 0;
    padding-left: 0;
    font-weight: bold;
    max-width: 100%;
    &:focus {
      box-shadow: none;
    }
  }

  button {
    padding: ${props => props.theme.space[2]}px;
  }
`

class NameField extends Component {
  state = { value: '' }

  componentDidMount = () => setTimeout(this.initData, 128)

  initData = () => {
    let { value } = this.state
    if (localStorage) {
      try {
        value = localStorage.getItem(LS_NAME_KEY)
        this.setState({ value })
      } catch (err) {
        localStorage.removeItem(LS_NAME_KEY)
      }
    }
  }

  onChange = e => {
    this.props.onChange(e)
    const { value } = e.target
    this.setState({ value })
    if (localStorage) {
      try {
        localStorage.setItem(LS_NAME_KEY, value)
      } catch (err) {
        localStorage.removeItem(LS_NAME_KEY)
      }
    }
  }

  render() {
    return (
      <Input
        {...this.props}
        color="black"
        value={this.state.value}
        onChange={this.onChange}
      />
    )
  }
}

const statusMessage = status =>
  status
    ? {
        success: 'Submitted, thank you!',
        error: 'Something went wrong 🚨'
      }[status]
    : 'Submit'
const statusColor = status =>
  status === 'success' || status === 'error' ? status.toString() : 'info'
const InnerForm = ({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
  setFieldValue,
  status
}) => (
  <form onSubmit={handleSubmit}>
    <Sheet maxWidth={48} p={[3, 4]} bg="white" boxShadowSize="md">
      <Header align="baseline">
        <NameField
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.name && errors.name}
          name="name"
          autoFocus
          aria-label="Title your workshop"
          placeholder="Getting Started with React.js"
          fontSize={5}
        />
        <Invert muted children={null} />
      </Header>
      <Composer onChange={setFieldValue} onBlur={handleBlur} />
    </Sheet>
    <Box align="center" pt={4} pb={5}>
      <Submit.lg
        onClick={handleSubmit}
        disabled={isSubmitting}
        value={statusMessage(status)}
        bg={statusColor(status)}
      />
    </Box>
  </form>
)
const SubmitForm = withFormik({
  validationSchema: yup.object().shape({
    name: yup.string().required('required'),
    body: yup.string()
  }),
  enableReinitialize: true,
  handleSubmit: (data, { props, setStatus, setSubmitting, resetForm }) => {
    const { name, body: text } = data
    const body = JSON.stringify({
      workshop_slug: 'WORKSHOP_SUBMISSION',
      feedback: { name, body: text }
    })
    api
      .post(`v1/workshop_feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      })
      .then(res => {
        resetForm()
        if (localStorage) {
          localStorage.removeItem(LS_NAME_KEY)
          localStorage.removeItem(LS_BODY_KEY)
        }
        setStatus('success')
      })
      .catch(e => {
        setSubmitting(false)
        setStatus('error')
      })
  },
  displayName: 'SubmitForm'
})(InnerForm)
export default SubmitForm
