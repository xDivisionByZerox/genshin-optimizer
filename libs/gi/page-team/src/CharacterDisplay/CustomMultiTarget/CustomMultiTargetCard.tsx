import { useBoolState } from '@genshin-optimizer/common/react-util'
import {
  CardThemed,
  InfoTooltip,
  ModalWrapper,
} from '@genshin-optimizer/common/ui'
import { arrayMove, deepClone } from '@genshin-optimizer/common/util'
import type { CustomTarget } from '@genshin-optimizer/gi/db'
import {
  initCustomTarget,
  type CustomMultiTarget,
} from '@genshin-optimizer/gi/db'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import {
  Box,
  Button,
  CardActionArea,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import type { Dispatch, SetStateAction } from 'react'
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TargetSelectorModal } from '../Tabs/TabOptimize/Components/TargetSelectorModal'
import CustomTargetDisplay from './CustomTargetDisplay'
export default function CustomMultiTargetCard({
  customMultiTarget: targetProp,
  setTarget: setTargetProp,
  onDelete,
  onDup: onDupProp,
}: {
  customMultiTarget: CustomMultiTarget
  setTarget: (t: CustomMultiTarget) => void
  onDelete: () => void
  onDup: () => void
}) {
  const { t } = useTranslation('page_character')
  const [target, setTarget] = useState(targetProp)
  useEffect(() => {
    if (JSON.stringify(targetProp) !== JSON.stringify(target))
      setTarget(targetProp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetProp])

  const { name, description } = target
  const [show, onShow, onHide] = useBoolState()

  const onDup = () => {
    onDupProp()
    onHide()
  }

  const onSave = useCallback(() => {
    onHide()
    setTargetProp(target)
  }, [onHide, setTargetProp, target])

  const addTarget = useCallback(
    (t: string[], multi?: number) => {
      const target_ = { ...target }
      target_.targets = [...target_.targets, initCustomTarget(t, multi)]
      setTarget(target_)
    },
    [target, setTarget]
  )

  const setCustomTarget = useCallback(
    (index: number) => (ctarget: CustomTarget) => {
      const targets = [...target.targets]
      targets[index] = ctarget
      setTarget({ ...target, targets })
    },
    [target, setTarget]
  )

  const deleteCustomTarget = useCallback(
    (index: number) => () => {
      if (
        Object.values(target.targets[index].bonusStats).length &&
        !window.confirm(`Are you sure you want to delete this target?`)
      )
        return
      const targets = [...target.targets]
      targets.splice(index, 1)
      setTarget({ ...target, targets })
    },
    [target, setTarget]
  )

  const setTargetIndex = useCallback(
    (oldInd: number) => (newRank?: number) => {
      if (newRank === undefined || newRank === 0) return
      const newInd = newRank - 1
      const targets = [...target.targets]
      arrayMove(targets, oldInd, newInd)
      setTarget({ ...target, targets })
    },
    [target, setTarget]
  )

  const dupCustomTarget = useCallback(
    (index: number) => () => {
      const targets = [...target.targets]
      targets.splice(index, 0, deepClone(targets[index]))
      setTarget({ ...target, targets })
    },
    [target, setTarget]
  )

  const copyToClipboard = () =>
    navigator.clipboard
      .writeText(JSON.stringify(target))
      .then(() => alert('Copied configuration to clipboard.'))
      .catch(console.error)

  const customTargetDisplays = useMemo(
    () =>
      target.targets.map((t, i) => (
        <CustomTargetDisplay
          key={t.path.join() + i}
          customTarget={t}
          setCustomTarget={setCustomTarget(i)}
          deleteCustomTarget={deleteCustomTarget(i)}
          rank={i + 1}
          maxRank={target.targets.length}
          setTargetIndex={setTargetIndex(i)}
          onDup={dupCustomTarget(i)}
        />
      )),
    [
      deleteCustomTarget,
      dupCustomTarget,
      setCustomTarget,
      setTargetIndex,
      target.targets,
    ]
  )

  return (
    <>
      <CardThemed bgt="light">
        <CardActionArea onClick={onShow}>
          <CardHeader
            title={
              <Box display="flex" gap={1} alignItems="center">
                <Chip
                  sx={{ minWidth: '8em' }}
                  color={target.targets.length ? 'success' : undefined}
                  label={
                    <Trans
                      t={t}
                      i18nKey="multiTarget.target"
                      count={target.targets.length}
                    >
                      {{ count: target.targets.length }} Targets
                    </Trans>
                  }
                />
                <Typography>{name}</Typography>
                {target.description && (
                  <InfoTooltip title={<Typography>{description}</Typography>} />
                )}
              </Box>
            }
          />
        </CardActionArea>
      </CardThemed>
      <ModalWrapper open={show} onClose={onSave}>
        <CardThemed>
          <CardHeader
            title={name}
            action={
              <IconButton onClick={onSave}>
                <CloseIcon />
              </IconButton>
            }
          />
          <Divider />
          <CardContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <NameDesc name={name} desc={description} setTarget={setTarget} />
            <Box display="flex" gap={2}>
              <Button
                onClick={onDup}
                color="info"
                sx={{ flexGrow: 1 }}
                startIcon={<ContentCopyIcon />}
              >
                {t('multiTarget.duplicate')}
              </Button>
              <Button
                color="info"
                onClick={copyToClipboard}
                startIcon={<ContentPasteIcon />}
                sx={{ flexGrow: 1 }}
              >
                Export
              </Button>
              <Button color="error" onClick={onDelete}>
                <DeleteForeverIcon />
              </Button>
            </Box>
          </CardContent>
          <Divider />
          <CardContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            {customTargetDisplays}
            <AddCustomTargetBtn setTarget={addTarget} />
          </CardContent>
        </CardThemed>
      </ModalWrapper>
    </>
  )
}
function NameDesc({
  name: nameProp,
  desc: descProp,
  setTarget,
}: {
  name: string
  desc?: string
  setTarget: Dispatch<SetStateAction<CustomMultiTarget>>
}) {
  const [name, setName] = useState(nameProp)
  const nameDeferred = useDeferredValue(name)
  const [desc, setDesc] = useState(descProp)
  const descDeferred = useDeferredValue(desc)

  useEffect(() => {
    setName(nameProp)
  }, [nameProp])

  useEffect(() => {
    setDesc(descProp)
  }, [descProp])

  useEffect(() => {
    setTarget((target) => ({
      ...target,
      name: nameDeferred,
    }))
    // Don't need to trigger when teamCharId is changed, only when the name is changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTarget, nameDeferred])

  useEffect(() => {
    setTarget((target) => ({
      ...target,
      description: descDeferred,
    }))
    // Don't need to trigger when teamCharId is changed, only when the name is changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTarget, descDeferred])

  return (
    <>
      <TextField
        fullWidth
        label="Custom Multi-target Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        fullWidth
        label="Custom Multi-target Description"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        multiline
        minRows={2}
      />
    </>
  )
}

function AddCustomTargetBtn({
  setTarget,
}: {
  setTarget: (t: string[], m?: number) => void
}) {
  const { t } = useTranslation('page_character')
  const [show, onShow, onClose] = useBoolState(false)
  const setTargetHandler = useCallback(
    (target: string[], multi?: number) => {
      onClose()
      setTarget(target, multi)
    },
    [onClose, setTarget]
  )

  return (
    <>
      <Button
        fullWidth
        onClick={onShow}
        startIcon={<AddIcon />}
        sx={{ mb: 1 }}
      >{t`multiTarget.addNewTarget`}</Button>
      <TargetSelectorModal
        showEmptyTargets
        flatOnly
        excludeHeal
        show={show}
        onClose={onClose}
        setTarget={setTargetHandler}
        excludeSections={['basic', 'custom']}
      />
    </>
  )
}