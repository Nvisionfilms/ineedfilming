-- Add meeting_outcome and opportunity_id columns to meetings table
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS meeting_outcome text,
ADD COLUMN IF NOT EXISTS opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meetings_opportunity_id ON public.meetings(opportunity_id);

COMMENT ON COLUMN public.meetings.meeting_outcome IS 'Outcome of the meeting: no_show, not_qualified, qualified, proposal_sent, negotiating, won';
COMMENT ON COLUMN public.meetings.opportunity_id IS 'Links meeting to an opportunity in the pipeline';